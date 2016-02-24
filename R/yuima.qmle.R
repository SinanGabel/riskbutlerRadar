#' An interface to the yuima::qmle function
#'
#' Currently univariate models, example given for GBM
#'
#' @param data  init*exp(rnorm(100, mean=0, sd=0.10)) where init=100
#' @param drift  "mu * x"
#' @param diffusion  "sigma * x"
#' @param start  list(mu = 0.10, sigma = 0.1)
#' @param method  [optional] "L-BFGS-B" with lower, upper and "BFGS" without bounds
#' @param lower  [optional] list(mu = 0, sigma = 0)
#' @param upper  [optional] list(mu = 0.50, sigma = 1)
#' @return maximum likelihood estimation
#' @export
#'
yuima.qmle <- function(data, summary = TRUE, drift, diffusion, start, ...) {

  data <- yuima::setData(data.frame(y = data))
  yobj <- yuima::setModel(drift, diffusion)
  yobj <- yuima::setYuima(model = yobj, data = data)

  # estimate
  # the likelihood function measures how likelihood a set of parameters is given the observed data
  res <- yuima::qmle(yobj, start, ...)

  if (summary == TRUE)
    return(mlefilter(res))
  else
    return(res)
}

# library(radar)
# yuima.qmle(data = log(ar), drift = "mu * x", diffusion = "sigma * x", method="L-BFGS-B", start = list(mu = 0.10, sigma = 0.1), lower = list(mu = 0, sigma = 0), upper = list(mu = 0.50, sigma = 1))

