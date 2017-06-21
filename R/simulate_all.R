#' Estimates SDE parameters for a univariate time series, and simulates future values for this SDE
#'
#'
#' @param data univariate time series of type numeric
#' @param T risk time horizon in years (default 1 year)
#' @param nsim number of simulations at time T (default 100)
#' @param delta data unit distance (default 1/252)
#' @param neg_values in data, boolean (default FALSE)
#' @return vector of double (numeric)
#' @export
#'
simulate_all <- function(data, T = 1, nsim = 100, delta = 1/252, estimations = 3, neg_values = FALSE, multi_model = TRUE)  {

  # ToDo: if neg_values in data => add constant = min(data) + 1

  ## . Estimate parameters
  # ycks model 3 => stricktly reduces movement of p4 because we only have time to make one single estimation for 5 seconds timeout restriction on api.ai
  js <- jsonlite::fromJSON('{"start": {"p1": 1,"p2": 0.1,"p3": 0.1,"p4": 1}, "lower": {"p1": -100,"p2": 0,"p3": 0,"p4": 0.75}, "upper": {"p1": 100,"p2": 100,"p3": 1,"p4": 1.25}}')
  win_less <- estimations - 1  # For 3 estimations choose e.g. w=4 and step=2, for 4 estimations choose e.g. w=6 and step=2 => default is one single estimation
  qmle_step <- 1

  est <- riskbutlerRadar::yuima.qmle.seq(data = log(data), window = (length(data) - win_less), step = qmle_step, delta = delta, drift = "p1 * (p2 - x)", diffusion = "p3 * x^p4", hurst = 0.5, solve.variable = "x", method="L-BFGS-B",  start = js$start, lower = js$lower, upper = js$upper)

  ## . Simulate
  coef_i <- win_less/qmle_step + 1
  xinit <- data[length(data)]

  return(exp(riskbutlerRadar::eulerOne(xinit = log(xinit), Terminal = T, nsim = nsim, parameter = list(p1 =est$coef$p1[coef_i], p2 = est$coef$p2[coef_i], p3 = est$coef$p3[coef_i], p4 = est$coef$p4[coef_i]))))
}




# dd <- getData(request = list(class = "FX", base_currency = "DKK", currency = "GBP", frequency = "day", limit = 100))
#
# sims <- simulate_all(dd)
#
# hist(sims)
# mean(sims)
# median(sims)
# dd[length(dd)]
# sd(sims)
#
#
# sims <- simulate_all(dd, T = 1/52, nsim = 150, delta = 1/365)
#
# hist(sims)
# mean(sims)
# median(sims)
# dd[length(dd)]
# sd(sims)
