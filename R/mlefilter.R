#' Filter the summary of mle result for use in javascript
#' This is a simple test function
#'
#' @param mle is the return value from a (yuima) qmle or mle estimation
#' @return json of results from summary(mle)
#' @export
#'
mlefilter <- function(mle) {
  res <- stats4::summary(mle)
  jsonlite::toJSON(list( m2logL = res@m2logL, coef = as.data.frame(res@coef), call = toString(res@call)))
}
