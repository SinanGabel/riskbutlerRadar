#' An interface to the yuima::qmle function
#'
#' Univariate and multivariate models, example given for univariate GBM
#'
#' @param data  list(x=data) or list(x1=data1, x2=data2,...) possibly use log or return of data.
#' @param delta  1 divided by the # of observations per year e.g. with business daily data typically: 1/252
#' @param summary TRUE or FALSE: TRUE
#' @param drift  "mu * x" or c("mu1 * x1",...)
#' @param diffusion  "sigma * x" or matrix(c("sigma1","0","0","sigma2"),2,2)
#' @param hurst 0.5
#' @param solve.variable "x" or c("x1","x2")
#' @param start  list(mu = 0.1, sigma = 0.1)
#' @param method  [optional] "L-BFGS-B" with lower, upper and "BFGS" without bounds
#' @param lower  [optional] list(mu = -1, sigma = 0)
#' @param upper  [optional] list(mu = 1, sigma = 1)
#' @return maximum likelihood estimation
#' @export
#'
yuima.qmle <- function(data, delta = 1/252, summary = TRUE, drift, diffusion, hurst = 0.5, solve.variable = "x", start, ...) {

  ymod <- yuima::setModel(drift = drift, diffusion = diffusion, hurst = hurst, solve.variable = solve.variable, state.variable = solve.variable)

  # valid to update data and yobj without changing ymod
  dat <- yuima::setData(data, delta = delta)
  yobj <- yuima::setYuima(model = ymod, data = dat)

  # estimate
  # the likelihood function measures how likelihood a set of parameters is given the observed data
  res <- yuima::qmle(yobj, start, ...)

  # To use estimates as start values in next or other qmle estimation set: start = as.list(res@coef)
  if (summary == TRUE) {
    res <- stats4::summary(res)
    list( m2logL = res@m2logL, coef = as.data.frame(res@coef), call = toString(res@call))
  }
  #return(mlefilter(res))
  else
    return(res)
}

# library(radar)
# library(jsonlite)
#
# note: fromJSON('{x1: [1,2,3...], x2: [4,5,6,...]}') = list(x1=[1,2,3,...], x2=list(4,5,6,...))
#
# --- univariate ---
# ar <- 100*exp(rnorm(100, mean=0, sd=0.10))
# yuima.qmle(data = log(ar), delta = 1/(24*365), drift = "mu * x", diffusion = "sigma * x", hurst = 0.5, solve.variable = "x", method="L-BFGS-B", start = list(mu = 0.10, sigma = 0.1), lower = list(mu = -10, sigma = 0), upper = list(mu = 10, sigma = 2))

# --- multivariate ---
# y1 <- 100*exp(rnorm(100, mean=0, sd=0.10))
# y2 <- 100*exp(rnorm(100, mean=0, sd=0.10))
# dat <- toJSON(structure(list(y1,y2), .Names = c("x1","x2")))
#
# xdata <- fromJSON(dat)  or
#
# xdata <- list(x1 = y1, x2 = y2)
#
# sol <- c("x1", "x2")
# b <- c("-theta1 * x1","-x1 - theta2 * x2")
# s <- matrix(c("1","0","x2","x1","gamma","0"),2,3)
#
# yuima.qmle(data = xdata, delta = 1/365, drift = b, diffusion = s, hurst = 0.5, solve.variable = sol, start = list(theta1 = 0.1, theta2 = 0.1, gamma = 0.1), method = "L-BFGS-B", lower = list(theta1 = 0, theta2 = 0, gamma = 0), upper = list(theta1 = 5, theta2 = 5, gamma = 5))
#


