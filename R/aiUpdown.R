#' Forecast of chance of profit and risk of loss for api.ai (this) updown financial activity agent
#'
#' @param result list of data from api.ai
#' @return list
#' @export
#'
aiUpdown <- function(result, ...) {

  if (missing(result)) {
    result <- jsonlite::fromJSON('{"parameters": {"activity_financial": "import", "amount_currency": {"amount": 100, "currency": "GBP"}, "base_currency": "DKK", "date": "2017-12-10"}}')
  }

  api <- result$parameters

  # temporary
  base_currency <- api$base_currency
  currency <- api$amount_currency$currency

  if (base_currency == currency) {

    txt <- jsonlite::unbox(paste("There is no foreign exchange risk on your", api$activity_financial, "activity because the base currency and activity currency are the same. To understand how this was calculated please go to riskbutler.com."))

  } else {

    ## . Check if results are already calculated and stored, else make new simulations; check if result and all parameters are there and correct;

    ## . Get market data
    # tip: preload httr in opencpu
    # tip: add date to fields to see actual data time stamps, and add verbose() to the POST parameters for more info on the call
    # todo: filter weekend data out; check if a result is returned; test with lasso if model 3 is appropriate or perhaps a simpler model can be used e.g. where p4=1 <=> Brennan 92
    freq <- "hour"
    xdata <- riskbutlerRadar::getData(request = list(class = "FX", base_currency = base_currency, currency = currency, frequency = freq, limit = 252))

    ## . Estimate parameters
    if (freq == "hour") {
      delta = 1/(365*24)
    } else {
      delta = 1/365
    }

    nsim <- 10000
    sims <- riskbutlerRadar::simulate_all(xdata, T = 1/52, nsim = nsim, delta = delta)
    xinit <- xdata[length(xdata)]

    ## Make wanted statistics
    sims <- sort(sims)
    q <- 0.01
    up <- (sims[round((1-q) * nsim)] - xinit)/xinit  # q * 100 percent chance of up = up, or more up
    down <- (sims[round(q * nsim)] - xinit)/xinit    # q * 100 percent chance of down = down, or further down

    ## Save results to db for next user
    ## Return forecast info to api.ai

    txt <- jsonlite::unbox(paste("The chance of profit is", format(up * 100, digits = 2), "percent, and the risk of loss is", format(down * 100, digits = 2), "percent of your", api$activity_financial, "activity amount. To understand how this was calculated please go to riskbutler.com."))
  }

  return(list(speech = txt, displayText = txt, source = jsonlite::unbox("riskbutler.net")))
}


#' Note: only FX currently, and risk time horizon 1 calendar week (7 days), data is hourly, 10000 simulations, quantiles are 1 and 99 percent, market data window is 252



# Call from api.ai is something like
# aiUpdown(id = "8c71919d-ebb6-467e-866f-0e05509afdde", timestamp = "2017-06-15T13:33:17.691Z", lang = "en", result = result, status = status, sessionId = "somerandomthing")

# ptm <- proc.time()
# aiUpdown()
# proc.time() - ptm



#' activity_financial export, import, trade or invest (default export, string)
#' activity date (default now + 7 calendar days, date format "2017-09-10")
