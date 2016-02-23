#' An interface to the yuima::qmle function
#'
#' Currently univariate models, example given for GBM
#'
#' @param p_drift  "mu * x"
#' @param p_diffusion  "sigma * x"
#' @param p_method  "L-BFGS-B"
#' @param p_start  list(mu = 0.10, sigma = 0.1)
#' @param p_lower  list(mu = 0, sigma = 0)
#' @param p_upper  list(mu = 0.50, sigma = 1)
#' @param p_data  init*exp(rnorm(100, mean=0, sd=0.10)) where init=100
#' @return maximum likelihood estimation
#' @export
#'
yuima.qmle <- function(p_drift = "mu * x", p_diffusion = "sigma * x", p_method="L-BFGS-B", p_start = list(), p_lower = list(), p_upper = list(), p_data = 1:10) {

  data <- yuima::setData(data.frame(y = p_data))
  mod <- yuima::setModel(p_drift, p_diffusion)
  mod <- yuima::setYuima(model = mod, data = data)

  # estimate
  # the likelihood function measures how likelihood a set of parameters is given the observed data
  yuima::qmle(mod, method = p_method, start = p_start, lower = p_lower, upper = p_upper)
}

# test t with missing observations, any difference?

# library(radar)
# yuima.qmle(p_drift = "mu * x", p_diffusion = "sigma * x", p_method="L-BFGS-B", p_start = list(mu = 0.10, sigma = 0.1), p_lower = list(mu = 0, sigma = 0), p_upper = list(mu = 0.50, sigma = 1), p_data = log(ar))
