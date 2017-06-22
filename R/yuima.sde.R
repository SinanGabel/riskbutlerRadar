#' yuima.sde returns parameters for some specific (yuima) sde models
#'
#' @param model (you3, yckls, yhdf)
#' @param multivariate boolean
#' @param correlated boolean, calculates correlations of data if multivariate
#' @param data multivariate data time series for multivariate modelling
#' @return list
#' @export
#'
yuima.sde <- function(model = "you3", multivariate = FALSE, correlated = FALSE, data) {

  rho <- 0
  if (correlated == TRUE) {
    rho <- cor(data)[2,1]
  }

  # dX = θ1·(θ2 - X)·dt + θ3·X·dW, Brennan & Schwartz 1980
  if (model == "you3" & multivariate == TRUE) {
    b <- c("p1.1 * (p2.1 - x1)", "p1.2 * (p2.2 - x2)")
    e21 <- gsub("rho", rho, "(p3.2 * x2) * rho")
    e22 <- gsub("rho", rho, "(p3.2 * x2) * sqrt(1 - (rho)^2)")
    s <- matrix(c("p3.1 * x1", e21, 0, e22), 2, 2)
    slu <- jsonlite::fromJSON('{"start": {"p1.1": 1,"p2.1": 0.1,"p3.1": 0.1, "p1.2": 1,"p2.2": 0.1,"p3.2": 0.1}, "lower": {"p1.1": -100,"p2.1": 0,"p3.1": 0, "p1.2": -100,"p2.2": 0,"p3.2": 0}, "upper": {"p1.1": 100,"p2.1": 100,"p3.1": 100, "p1.2": 100,"p2.2": 100,"p3.2": 100}}')
    sol <- c("x1", "x2")

  } else if (model == "you3") {
    b <- "p1 * (p2 - x)"
    s <- "p3 * x"
    slu <- jsonlite::fromJSON('{"start": {"p1": 1, "p2": 0.1, "p3": 0.1}, "lower": {"p1": -100, "p2": 0, "p3": 0}, "upper": {"p1": 100, "p2": 100, "p3": 1}}')
    sol <- "x"

    # dX = θ1·(θ2 - X)·dt + θ3·X^θ4·dW, Chan-Karolyi-Longstaff-Sanders 1992
  } else if (model == "yckls" & multivariate == TRUE) {
    b <- c("p1.1 * (p2.1 - x1)", "p1.2 * (p2.2 - x2)")
    e21 <- gsub("rho", rho, "(p3.2 * x2^p4.2) * rho")
    e22 <- gsub("rho", rho, "(p3.2 * x2^p4.2) * sqrt(1 - (rho)^2)")
    s <- matrix(c("p3.1 * x1^p4.1", e21, 0, e22), 2, 2)
    slu <- jsonlite::fromJSON('{"start": {"p1.1": 1,"p2.1": 0.1,"p3.1": 0.1, "p4.1": 1, "p1.2": 1,"p2.2": 0.1,"p3.2": 0.1, "p4.2": 1}, "lower": {"p1.1": -100,"p2.1": 0,"p3.1": 0, "p4.1": 0, "p1.2": -100,"p2.2": 0,"p3.2": 0, "p4.2": 0}, "upper": {"p1.1": 100,"p2.1": 100,"p3.1": 100, "p4.1": 2, "p1.2": 100,"p2.2": 100,"p3.2": 100, "p4.1": 2}}')
    sol <- c("x1", "x2")

  } else if (model == "yckls") {
    b <- "p1 * (p2 - x)"
    s <- "p3 * x^p4"
    slu <- jsonlite::fromJSON('{"start": {"p1": 1,"p2": 0.1,"p3": 0.1,"p4": 1}, "lower": {"p1": -100,"p2": 0,"p3": 0,"p4": 0}, "upper": {"p1": 100,"p2": 100,"p3": 1,"p4": 2}}')
    sol <- "x"

    # dX = sigma^2/2·(beta - gamma·X/Sqrt(delta^2 + (X - mu)^2)·dt + sigma·dW, Hyperbolic diffusion (dynamics of sand - the sand project, AAU); Iacus, 2011, Chicago R/Finance, April 29
  } else if (model == "yhdf" & multivariate == TRUE) {
    b <- c("(p1.1^2)/2 * (p2.1 - p3.1 * x1 /sqrt(p4.1^2 + (x1 - p5.1)^2))", "(p1.2^2)/2 * (p2.2 - p3.2 * x2 /sqrt(p4.2^2 + (x2 - p5.2)^2))")
    e21 <- gsub("rho", rho, "p1.2 * rho")
    e22 <- gsub("rho", rho, "p1.2 * sqrt(1 - (rho)^2)")
    s <- matrix(c("p1.1", e21, 0, e22), 2, 2)
    slu <- jsonlite::fromJSON('{"start": {"p1.1": 0.1,"p2.1": 0.1,"p3.1": 0.1, "p4.1": 0.1, "p5.1": 0.1, "p1.2": 0.1,"p2.2": 0.1,"p3.2": 0.1, "p4.2": 0.1, "p5.2": 0.1}, "lower": {"p1.1": 0,"p2.1": -100,"p3.1": -1, "p4.1": 0, "p5.1": -100, "p1.2": 0,"p2.2": -100,"p3.2": -1, "p4.2": 0, "p5.2": -100}, "upper": {"p1.1": 1,"p2.1": 100,"p3.1": 1, "p4.1": 1, "p5.1": 100, "p1.2": 1,"p2.2": 100,"p3.2": 1, "p4.1": 1, "p5.2": 100}}')
    sol <- c("x1", "x2")

  } else if (model == "yhdf") {
    b <- "(p1^2)/2 * (p2 - p3 * x /sqrt(p4^2 + (x - p5)^2))"
    s <- "p1"
    slu <- jsonlite::fromJSON('{"start": {"p1": 0.1,"p2": 0.1,"p3": 0.1,"p4": 0.1,"p5": 0.1}, "lower": {"p1": 0,"p2": -100,"p3": -1,"p4": 0,"p5": -100}, "upper": {"p1": 1,"p2": 100,"p3": 1,"p4": 1,"p5": 100}}')
    sol <- "x"

  }

  return(list(drift = b, diffusion = s, solve.variable = sol, slu = slu))
}



# # univariate
# yuima.sde(model = "you3")
# yuima.sde(model = "yckls")
# yuima.sde(model = "yhdf")
#
# # multivariate
# yuima.sde(model = "you3", , multivariate = TRUE, correlated = FALSE, xdata)
# yuima.sde(model = "you3", , multivariate = TRUE, correlated = TRUE, xdata)


