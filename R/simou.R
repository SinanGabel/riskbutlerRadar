#' simou
#'
#' curl https://riskbutler.net/ocpu/github/sinangabel/radar/R/simou/json -H "Content-Type: application/json" -d '{"a":3, "b": 1, "c": 2, "n": 100}'
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
