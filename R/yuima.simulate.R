#' An interface to the yuima::simulate function
#'
#' Multivariate models
#'
#' @param object yuima setModel() object e.g. setModel(drift = "mu * x", diffusion = "sigma * x", ...)
#' @param sumsim sum simulations vertical (default TRUE)
#' @param nsim number of simulations (default 1)
#' @return simulations
#' @export
#'
yuima.simulate <- function(object, sumsim = TRUE, nsim = 1, ...) {

  if (nsim == 1) {
    s <- yuima::simulate(object, ...)
    return(s@data@original.data)

  } else if (sumsim == TRUE) {
      r <- c(0)
      m <- nsim
      for(i in 1:m) {
        s <- yuima::simulate(object, ...)
        t <- s@data@original.data
        r <- r + t
    }
    return(r)

  } else {
      r <- c()
      m <- nsim
      for(i in 1:m) {
        s <- yuima::simulate(object, ...)
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

# X <- yuima.simulate(setModel(drift = "mu * x", diffusion = "sigma * x"), sumsim = FALSE, nsim = 1, xinit = 100, true.parameter = list(mu = 0.1, sigma = 0.07), sampling = setSampling(Terminal = 1, n = 10))

# X <- yuima.simulate(setModel(drift = "mu * x", diffusion = "sigma * x"), sumsim = TRUE, nsim = 100, xinit = 100, true.parameter = list(mu = 0.1, sigma = 0.07), sampling = setSampling(Terminal = 1, n = 10))

