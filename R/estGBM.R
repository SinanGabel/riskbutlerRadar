#' Simulate and estimate Geometric Brownian Motion stochastic process
#'
#' This is a simple test function
#'
#' @param T is time in years e.g. T=1 is one year
#' @param n number of observations per year e.g. n=252=12*21 i.e. 21 trading days per month
#' @param mu is the mean drift value per year, e.g. 0.12 is 12 percent drift per year
#' @param sigma is the volatility per year, e.g. 0.034 is 3.4 percent volatility per year
#' @return maximum likelihood estimation
#' @export
#'
estGBM <- function(T = 1, n = 252, mu = 0.1, sigma = 0.2) {

  mod <- yuima::setModel(drift = "mu * x", diffusion = "sigma * x")
  T <- T
  n <- n * T

  # simulate some data for the estimation (alternatively use real data)
  mod <- yuima::simulate(mod, xinit = 100, true.parameter = list(mu = mu, sigma = sigma), sampling = yuima::setSampling(Terminal = T, n = n))

  # estimate
  # the likelihood function measures how likelihood a set of parameters is given the observed data
  yuima::qmle(mod, start = list(mu = 0.10, sigma = 0.1), lower = list(mu = 0, sigma = 0), upper = list(mu = 0.50, sigma = 1))
}

# ocpu.rpc("estGBM",{}, function(r) {console.log(r); }) => {m2logL: Array[1], coef: Array[1], call: Array[1]}
# JSON.parse(obj.coef) converts the specific string to array of array of numbers
#
# Next steps: add parameters: data; enable different frequencies (adjust T? n? delta?);
