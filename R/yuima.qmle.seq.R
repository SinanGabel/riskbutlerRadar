#' An interface to the yuima::qmle function
#'
#' multivariate and univariate models, example given for GBM
#'
#' @param data  list(x=data) or list(x1=data1, x2=data2,...) possibly use log or return of data.
#' @param delta  1 divided by the # of observations per year e.g. with business daily data typically: 1/252
#' @param window 100
#' @param step 10
#' @param summary TRUE or FALSE: TRUE
#' @param drift  "mu * x" or c("mu1 * x2",...)
#' @param diffusion  "sigma * x" or matrix(c("sigma1","0","0","sigma2"),2,2)
#' @param hurst 0.5
#' @param solve.variable "x" or c("x1","x2")
#' @param start  list(mu = 0.10, sigma = 0.1)
#' @param method  [optional] "L-BFGS-B" with lower, upper and "BFGS" without bounds
#' @param lower  [optional] list(mu = 0, sigma = 0)
#' @param upper  [optional] list(mu = 0.50, sigma = 1)
#' @return maximum likelihood estimation
#' @export
#' @importFrom foreach %do%
#'
yuima.qmle.seq <- function(data, window = 100, step = 10, delta = 1/252, summary = TRUE, drift, diffusion, hurst = 0.5, solve.variable = "x", start, ...) {

  ymod <- yuima::setModel(drift = drift, diffusion = diffusion, hurst = hurst, solve.variable = solve.variable, state.variable = solve.variable)

  #
  sekvens <- function(n, w, s) {
    l <- seq(1, n - w + s, s)

    if ((l[length(l)] + w - 1) > n ) {
      l[length(l)] = n - w + 1
    }

    return(l)
  }

  # check for multivariate model
  if (length(drift) > 1) {multi = TRUE}

  # check foreach further: even, uneven indexes; vector or matrix etc.
  w <- window
  #step <- 10
  if (multi == FALSE) {
    n <- length(data)
  } else {
    n <- length(data[,1])
  }

  #l <- seq(1, n - w + step, step)
  l <- sekvens(n, w, step)

  est = start
  # parallel %dopar% or %do%
  #r <- foreach::foreach(i=l, .combine = cbind, .packages="foreach") %do% {
  r <- foreach::foreach(i = l, .combine = cbind) %do% {

    if (multi == FALSE) {
      dat <- data[seq(i, i+w-1)]
    } else {
      dat <- data[seq(i, i+w-1),]
    }

    dat <- yuima::setData(dat, delta = delta)
    yobj <- yuima::setYuima(model = ymod, data = dat)
    res <- yuima::qmle(yobj, start = est, ...)

    # To use estimates as start values in next or other qmle estimation set: start = as.list(res@coef)
    est <- as.list(res@coef)
    res@coef
  }

  if (summary == TRUE)
    #return(jsonlite::toJSON(list( call = list(seq = l, w = w, step = step, n = n), coef = as.data.frame(t(r)))))
    return(list( call = list(seq = l, w = w, step = step, n = n), coef = as.data.frame(t(r))))
  else
    return(r)
}



# --- Simulations for dX = θ1·(θ2 - X)·dt + θ3·dW, Ornstein-Uhlenbeck (OU) 1 ---

# http://math.stackexchange.com/questions/697748/correlation-between-two-stochastic-processes
#
# dX = a X dt + s1 dW(X)
# dY = b Y dt + s2 (rho dW(X) + sqrt(1 - rho²) dW(Y))

# COV = ((s1, 0),(s2 rho, s2 sqrt(1 - rho^2)))
# s1 and s2 are functions


#
# sol <- c("x1", "x2")
#
# b <- c("p1.1 * (p2.1 - x1)", "p1.2 * (p2.2 - x2)")
#
# s <- matrix(c("p3.1 * x1", "0", "(p3.2 * x2) * rho", "(p3.2 * x2) * sqrt(1 - rho^2)"),2,2)
#
# js <- jsonlite::fromJSON('{"start": {"p1.1": 1,"p2.1": 0.1,"p3.1": 0.1, "p1.2": 1,"p2.2": 0.1,"p3.2": 0.1}, "lower": {"p1.1": -100,"p2.1": 0,"p3.1": 0, "p1.2": -100,"p2.2": 0,"p3.2": 0}, "upper": {"p1.1": 100,"p2.1": 100,"p3.1": 100, "p1.2": 100,"p2.2": 100,"p3.2": 100}}')
#
# est <- yuima.qmle.seq(data = log(xdata), window = 300, step = 10, delta = 1/365, drift = b, diffusion = s, hurst = 0.5, solve.variable = sol, method = "L-BFGS-B", start = js$start, lower = js$lower, upper = js$upper)


# library(radar)
# library(jsonlite)
#
# note: fromJSON('{x1: [1,2,3...], x2: [4,5,6,...]}') = list(x1=[1,2,3,...], x2=list(4,5,6,...))
#
# --- univariate ---
# ar <- 100*exp(rnorm(100, mean=0, sd=0.10))
# yuima.qmle(data = log(ar), delta = 1/(24*365), drift = "mu * x", diffusion = "sigma * x", hurst = 0.5, solve.variable = "x", method="L-BFGS-B", start = list(mu = 0.10, sigma = 0.1), lower = list(mu = 0, sigma = 0), upper = list(mu = 0.50, sigma = 1))

# --- multivariate ---
# y1 <- 100*exp(rnorm(100, mean=0, sd=0.10))
# y2 <- 100*exp(rnorm(100, mean=0, sd=0.10))
# dat <- toJSON(structure(list(y1,y2), .Names = c("x1","x2")))
#
# xdata <- fromJSON(dat)
#
# sol <- c("x1", "x2")
# b <- c("-theta1 * x1","-x1 - theta2 * x2")
# s <- matrix(c("1","0","x2","x1","gamma","0"),2,3)
#
# yuima.qmle(data = xdata, delta = 1/365, drift = b, diffusion = s, hurst = 0.5, solve.variable = sol, start = list(theta1 = 0.1, theta2 = 0.1, gamma = 0.1), method = "L-BFGS-B", lower = list(theta1 = 0, theta2 = 0, gamma = 0), upper = list(theta1 = 5, theta2 = 5, gamma = 5))
#

# --- library(foreach) ---
# w <- 60;
# step <- 10;
# foreach(i=seq(1,length(ar)-w+step,step)) %do% ar[seq(i,i+w-1)]


# --- library(doParallel) ---
#
# Find out how many cores are available (if you don't already know): detectCores()
#
# Create cluster with desired number of cores: cl <- makeCluster(3)
#
# Register cluster: registerDoParallel(cl) or simply registerDoParallel()
#
# Find out how many cores are being used: getDoParWorkers()


# --- Ideas ---
#
# . return vector of parameter estimates: Make a backtest.js function that takes these estimation results
# . auto-run different sets of lower and upper parameter constraints


