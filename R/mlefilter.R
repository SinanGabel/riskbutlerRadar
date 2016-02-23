#' Filter the summary of mle result for use in javascript
#' This is a simple test function
#'
#' @param mle is the return value from a yuima qmle estimation
#' @return list of results from summary(mle)
#' @export
#'
mlefilter <- function(mle) {
  res <- stats4::summary(mle)
  list( m2logL = res@m2logL, coef = jsonlite::toJSON(as.data.frame(res@coef)), call = toString(res@call) )
}
