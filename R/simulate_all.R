#' Estimates SDE parameters for a univariate time series, and simulates future values for this SDE
#'
#'
#' @param data univariate time series of type numeric
#' @param model yuima sde model (you3, yckls, yhdf)
#' @param T risk time horizon in years (default 1 year)
#' @param nsim number of simulations at time T (default 100)
#' @param delta data unit distance (default 1/252)
#' @param estimations integer, number of qmle estimations
#' @param neg_values in data, boolean (default FALSE)
#' @return vector of double (numeric)
#' @export
#'
simulate_all <- function(data, model = "you3", T = 1, nsim = 100, delta = 1/252, estimations = 3, neg_values = FALSE)  {

  xinit <- data[length(data)]

  # ToDo: if neg_values in data => add constant = min(data) + 1
  mini <- min(data)

  # log transform
  if ((max(data) - mini)/mini > 0.02) {
    take_log <- TRUE
    data <- log(data)
    xinit <- log(xinit)

  # normalisation
  } else {
    take_log <- FALSE
    avg <- mean(data)
    std <- sd(data)
    data <- (data - avg)/std
    xinit <- 1
  }

  ## . Estimate parameters
  p <- riskbutlerRadar::yuima.sde(model)

  win_less <- estimations - 1  # For 3 estimations choose e.g. w=4 and step=2, for 4 estimations choose e.g. w=6 and step=2 => default is one single estimation
  qmle_step <- 1

  est <- riskbutlerRadar::yuima.qmle.seq(data = data, window = (length(data) - win_less), step = qmle_step, delta = delta, drift = p$drift, diffusion = p$diffusion, hurst = 0.5, solve.variable = p$solve.variable, method="L-BFGS-B",  start = p$slu$start, lower = p$slu$lower, upper = p$slu$upper)

  # . Simulate
  coef_i <- win_less/qmle_step + 1

  est <- as.data.frame(t(est$coef))
  est <- as.data.frame(t(est[length(est)]))
  res <- riskbutlerRadar::eulerOne(xinit = xinit, model = model, Terminal = T, nsim = nsim, parameter = est)

  if (take_log == TRUE) {
    return(exp(res))
  } else {
    # todo: check this
    return(res * std + avg)
  }
}




# dd <- getData(request = list(class = "FX", base_currency = "DKK", currency = "GBP", frequency = "day", limit = 100))
#
# sims <- simulate_all(dd, model = "you3", T = 1/12, nsim = 10000, delta = 1/365, estimations = 5)
#
# hist(sims)
# mean(sims)
# median(sims)
# dd[length(dd)]
# sd(sims)
#

