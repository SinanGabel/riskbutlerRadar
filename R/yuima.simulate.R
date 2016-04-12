#' An interface to the yuima::simulate function
#'
#' Multivariate models
#'
#' @param sumsim  sum simulations vertically (default TRUE)
#' @param nsim number of simulations (default 1)
#' @param drift  (e.g."mu * x")
#' @param diffusion  (e.g. "sigma * x")
#' @param hurst 0.5
#' @param solve.variable "x"
#' @param xinit initial value vector of state variables (default 1)
#' @param Terminal (default 1)
#' @param n number of trading times (default 1)
#' @param parameter named list of parameters (name true.parameter in yuima).
#' @return simulations
#' @export
#'
#'
yuima.simulate <- function(setseed = FALSE, sumsim = TRUE, nsim = 1, drift, diffusion, hurst = 0.5, solve.variable = "x", xinit = 1, Terminal = 1, n = 100, parameter, grid = NULL) {

  ymod <- yuima::setModel(drift = drift, diffusion = diffusion, hurst = hurst, solve.variable = solve.variable)
  ysam <- yuima::setSampling(Terminal = Terminal, n = n, grid = grid)
  yobj <- yuima::setYuima(model = ymod, sampling = ysam)

  if (nsim == 1) {

    if (setseed == TRUE) {
      set.seed(123)
    }

    s <- yuima::simulate(yobj, xinit = xinit, true.parameter = parameter)
    return(s@data@original.data[-1,])

  } else if (sumsim == TRUE) {
      r <- c(0)
      m <- nsim
      for(i in 1:m) {

        if (setseed == TRUE) {
          set.seed(123)
        }

        s <- yuima::simulate(yobj, xinit = xinit, true.parameter = parameter)
        t <- s@data@original.data
        r <- r + t[-1,]
    }
    return(r)

  } else {
      r <- c()
      m <- nsim
      for(i in 1:m) {

        if (setseed == TRUE) {
          set.seed(123)
        }

        s <- yuima::simulate(yobj, xinit = xinit, true.parameter = parameter)
        t <- s@data@original.data
        r <- rbind(r,t[-1,], deparse.level = 0)
        #r <- cbind(r, t)
      }
      #avg <- apply(res, 1, mean)
      #vol <-  apply(res, 1, sd)
      return(r)
  }
}

# library(radar)

# note: sumsim, nsim and n
# X <- yuima.simulate(setseed = FALSE, sumsim = FALSE, nsim = 10, drift = "mu * x", diffusion = "sigma * x", xinit = 100, hurst = 0.5, solve.variable = "x", Terminal = 1, n = 3, parameter = list(mu = 0.1, sigma = 0.07))

