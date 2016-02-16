#' simou
#'
#' Simulates some OU numbers
#' @param a, b, c are the parameters for the OU stochastic process
#' @param n numer of simulated numbers
#' @return simulated numbers
#' @export
simou <- function(a,b,c,n) {
  X <- sde::sde.sim(model="OU", theta=c(a,b,c), N=n, delta=1)
  return(X)
}
