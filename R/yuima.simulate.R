#' An interface to the yuima::simulate function
#'
#' Multivariate models
#'
#' @param sumsim  sum simulations vertically (default TRUE)
#' @param nsim number of simulations (default 1)
#' @param drift  (e.g."mu * x")
#' @param diffusion  (e.g. "sigma * x")
#' @param xinit initial value vector of state variables (default 1)
#' @param Terminal (default 1)
#' @param n number of trading times (default 1)
#' @param parameter named list of parameters (name true.parameter in yuima).
#' @return simulations
#' @export
#'
#'
yuima.simulate <- function(sumsim = TRUE, nsim = 1, drift, diffusion, xinit = 1, Terminal = 1, n = 100, parameter) {

  ymod <- yuima::setModel(drift = drift, diffusion = diffusion)
  ysam <- yuima::setSampling(Terminal = Terminal, n = n)
  yobj <- yuima::setYuima(model = ymod, sampling = ysam)

  if (nsim == 1) {
    s <- yuima::simulate(yobj, xinit = xinit, true.parameter = parameter)
    return(s@data@original.data)

  } else if (sumsim == TRUE) {
      r <- c(0)
      m <- nsim
      for(i in 1:m) {
        s <- yuima::simulate(yobj, xinit = xinit, true.parameter = parameter)
        t <- s@data@original.data
        r <- r + t
    }
    return(r)

  } else {
      r <- c()
      m <- nsim
      for(i in 1:m) {
        s <- yuima::simulate(yobj, xinit = xinit, true.parameter = parameter)
        t <- s@data@original.data
        r <- cbind(r, t)
      }
      #avg <- apply(res, 1, mean)
      #vol <-  apply(res, 1, sd)
      return(r)
  }
}

# library(radar)

# note: sumsim, nsim and n

# X <- yuima.simulate(drift = "mu * x", diffusion = "sigma * x", sumsim = TRUE, nsim = 100, xinit = 100, parameter = list(mu = 0.1, sigma = 0.07), Terminal = 1, n = 10)

