#' estimate Geometric Brownian Motion stochastic process
#'
#'
#'
#' @return maximum likelihood estimation
#' @export
#'
estGBM <- function() {
  mod <- yuima::setModel(drift = "mu * x", diffusion = "sigma * x")
  T <- 1
  n <- 252 * T

  # simulate some data for the estimation (alternatively use real data)
  mod <- yuima::simulate(mod, xinit = 100, true.parameter = list(mu = 0.10, sigma = 0.1), sampling = setSampling(Terminal = T, n = n))

  # estimate
  mle <- yuima::qmle(mod, start = list(mu = 0.10, sigma = 0.1), lower = list(mu = 0, sigma = 0), upper = list(mu = 0.50, sigma = 1))
  return(mle)
}

