#' Gets latest available (our sources) univariate financial market data
#'
#' FX: Always expressed as the value in base currency (this may not follow trading convention)
#'
#' @param request list()
#' @return vector of double (numeric)
#' @export
#'
getData <- function(request = list(class = "FX", base_currency = "EUR", currency = "USD", frequency = "day", limit = 100)) {

  if (request$class == "FX") {

      if (request$base_currency == request$currency) {
        return(rep.int(1, request$limit))
      }

      ## . Get market data
      # tip: preload httr in opencpu
      # tip: add date to fields to see actual data time stamps, and add verbose() to the POST parameters for more info on the call
      # todo: filter weekend data out; check if a result is returned; test with lasso if model 3 is appropriate or perhaps a simpler model can be used e.g. where p4=1 <=> Brennan 92

      fields <- c(paste("new.", request$base_currency, sep=""), paste("new.", request$currency, sep=""))

      if (request$frequency == "day") {
         sel <- list("_id" = list("$gt" = "a"), "type" = "hour", "date.3" = 18)
      } else {
         sel <- list("_id" = list("$gt" = "a"), "type" = "hour")
      }

      body <- list(selector = sel, fields = fields, limit = request$limit, sort = jsonlite::fromJSON('[{"_id": "desc"}]'))

      r <- httr::POST("https://riskbutler.net/fx1/_find", body = body, encode = "json")

      ## . Transform data
      rates <- jsonlite::fromJSON(rawToChar(r$content), flatten = TRUE)
      xdata <- rev(rates$docs[,1]/rates$docs[,2])
  }

  return(xdata)
}


# getData(request = list(class = "FX", base_currency = "DKK", currency = "GBP", frequency = "day", limit = 100))
#
#
# getData(request = list(class = "FX", base_currency = "USD", currency = "USD", frequency = "day", limit = 100))
#
#
# getData(request = list(class = "FX", base_currency = "EUR", currency = "USD", frequency = "day", limit = 100))
#
# ptm <- proc.time()
# dd <- getData(request = list(class = "FX", base_currency = "USD", currency = "EUR", frequency = "day", limit = 100))
# proc.time() - ptm
#
# plot(dd)
#
# ptm <- proc.time()
# dd <- getData(request = list(class = "FX", base_currency = "USD", currency = "EUR", frequency = "hour", limit = 100))
# proc.time() - ptm
#
# plot(dd)



