#' Estimates SDE parameters for a univariate time series, and simulates future values for this SDE
#'
#' Daily data for longer than 7 days risk time horizon, else hourly data (up to 7 days risk time horison)
#'
#' @param data univariate time series of type numeric
#' @param T risk time horizon in years
#' @param nsim number of simulations at time T
#' @param delta data unit distance
#' @return json
#' @export
#'
simulate_all <- function(data, T = 1, nsim = 100, delta = 1/252)  {

  ## . Estimate parameters
  # ycks model 3
  js <- jsonlite::fromJSON('{"start": {"p1": 1,"p2": 0.1,"p3": 0.1,"p4": 1}, "lower": {"p1": -100,"p2": 0,"p3": 0,"p4": 0}, "upper": {"p1": 100,"p2": 100,"p3": 1,"p4": 2}}')
  win_less <- 4
  qmle_step <- 2

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
