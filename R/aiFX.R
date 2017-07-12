#' Return forecast of chance of profit and risk of loss for api.ai (this) updown financial activity agent
#'
#' @param result list of data from api.ai
#' @return list
#' @export
#'
aiFX <- function(result, ...) {

  if (missing(result)) {
    result <- jsonlite::fromJSON('{"parameters": {"risk_type": "fx", "activity_financial": "import", "amount_currency": {"amount": 100, "currency": "GBP"}, "base_currency": "DKK", "date": "2017-12-10"}}')
  }

  api <- result$parameters
  base_currency <- api$base_currency
  currency <- api$amount_currency$currency

  info <- "info@riskbutler.com"

  if (base_currency == currency) {

    txt <- jsonlite::unbox(paste("There is no foreign exchange risk on your", api$activity_financial, "activity because the base currency", base_currency, " and activity currency", currency, " are the same.", info))

  } else {


    calc <- aiCalc(api)

    # Export
    up <- calc$up
    down <- calc$down

    # Import and buy-side of trade or invest will loose on FX changes if rate goes up, and vice versa for sell-side
    txt_ext <- ""
    if (api$activity_financial == "import" | api$activity_financial == "invest" | api$activity_financial == "trade") {

      tmp <- calc$up
      up <- calc$down
      down <- tmp

      if (api$activity_financial == "invest" | api$activity_financial == "trade") {
          txt_ext <- paste("For the buy-side of the", api$activity_financial, "activity: ")
      }
    }

    txt <- jsonlite::unbox(paste(txt_ext, "Due to foreign exchange changes, the 30 day chance of profit is", format(abs(up) * 100, digits = 2), "percent and the risk of loss is", format(abs(down) * 100, digits = 2), "percent of the", api$activity_financial, "activity amount. The latest foreign exchange price is", base_currency, format(calc$xinit, digits = 4), "=", currency, "1.0000. The actual profit or loss can be higher than estimated.", info))

  }

  # result
  return(list(speech = txt, displayText = txt, source = jsonlite::unbox("riskbutler.net")))
}


#' Note: only FX currently, and risk time horizon 1 calendar week (7 days), data is hourly, 10000 simulations, quantiles are 1 and 99 percent, market data window is 252



# Call from api.ai is something like
# aiFX(id = "8c71919d-ebb6-467e-866f-0e05509afdde", timestamp = "2017-06-15T13:33:17.691Z", lang = "en", result = result, status = status, sessionId = "somerandomthing")

# ptm <- proc.time(); aiFX(jsonlite::fromJSON('{"parameters": {"activity_financial": "import", "amount_currency": {"amount": 100, "currency": "GBP"}, "base_currency": "DKK", "date": "2017-12-10"}}')); proc.time() - ptm

# ptm <- proc.time()
# aiFX()
# proc.time() - ptm

# aiFX(jsonlite::fromJSON('{"parameters": {"activity_financial": "trade", "amount_currency": {"amount": 100, "currency": "USD"}, "base_currency": "GBP", "date": "2017-12-10"}}'));

# aiFX(jsonlite::fromJSON('{"parameters": {"activity_financial": "trade", "amount_currency": {"amount": 100, "currency": "USD"}, "base_currency": "NOK", "date": "2017-12-10"}, "something": "else"}'));

#' activity_financial export, import, trade or invest (default export, string)
#' activity date (default now + 7 calendar days, date format "2017-09-10")
