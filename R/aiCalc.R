#' Forecast of chance of profit and risk of loss for api.ai (this) updown financial activity agent
#'
#' Todo: use cron to pre-generate model parameter estimations, always use latest estimations as start values
#'
#' @param json parameters data from api.ai
#' @return list
#' @export
#'
aiCalc <- function(json) {

  if (missing(json)) {
    json <- jsonlite::fromJSON('{"risk_type": "fx", "activity_financial": "import", "amount_currency": {"amount": 100, "currency": "GBP"}, "base_currency": "DKK", "date": "2017-12-10"}')
  }

  api <- json
  recalculate <- TRUE

  # temporary
  base_currency <- api$base_currency
  currency <- api$amount_currency$currency
  symbol <- paste(base_currency, currency, sep = "")

  if (base_currency == currency) {

    return(list(up = 0, down = 0, xinit = 1, symbol = symbol))

  } else {

    ## . Check if results are already calculated and stored, else make new simulations; check if result and all parameters are there and correct;
    db <- "/var/sql/rdata.db"
    sql <- sqlite.sql(url = db, stmt = paste('select * from fx where name = "', symbol, '" order by date desc limit 1', sep = ""))

    if (nrow(sql) > 0) {

      json <- jsonlite::fromJSON(sql$est)

      # Only recalculate if at least one hour has passed
      if ((as.POSIXct(json$time) + 3600) > Sys.time()) {
        xinit <- json$price
        up <- json$up
        down <- json$down

        recalculate <- FALSE
      }
    }
  }

    # remove in production, for test only
    #recalculate <- TRUE

    if (recalculate == TRUE) {

      ## . Get market data
      # tip: preload httr in opencpu
      # tip: add date to fields to see actual data time stamps, and add verbose() to the POST parameters for more info on the call
      # todo: filter weekend data out; check if a result is returned; test with lasso if model 3 is appropriate or perhaps a simpler model can be used e.g. where p4=1 <=> Brennan 92
      freq <- "day"
      xdata <- riskbutlerRadar::getData(request = list(class = "FX", base_currency = base_currency, currency = currency, frequency = freq, limit = 100))

      ## . Estimate parameters
      if (freq == "hour") {
        delta <- 1/(365*24)
      } else {
        delta <- 1/365
      }

      nsim <- 10000
      sims <- riskbutlerRadar::simulate_all(xdata, model = "you3", T = 1/12, nsim = nsim, delta = delta, estimations = 1)
      xinit <- xdata[length(xdata)]

      ## Make wanted statistics
      sims <- sort(sims)
      q <- 0.01
      up <- (sims[round((1-q) * nsim)] - xinit)/xinit  # q * 100 percent chance of up = up, or more up
      down <- abs((sims[round(q * nsim)] - xinit)/xinit)    # q * 100 percent chance of down = down, or further down


      # Save result for later
      # Use pre-calculated estimations with latest market value saved <= setup cron to make these calculations every hour
      # If no result, then call opencpu directly and present result as text
      dt <- Sys.time()
      value <- paste('{"symbol": "',  symbol, '", "up": ', up, ', "down": ', down , ', "time": "', dt, '", "price": ', xinit, '}', sep = "")
      stmt <- paste('insert into fx (name, date, est) values("', symbol, '", "', dt, '", json(\'', value, '\'))', sep = "")
      sqlite.sql(url = db, stmt = stmt)
    }

  # result
  return(list(up = up, down = down, xinit = xinit, symbol = symbol))
}


#' Note: only FX currently, and risk time horizon 1 calendar week (7 days), data is hourly, 10000 simulations, quantiles are 1 and 99 percent, market data window is 252



# Call from api.ai is something like
# aiCalc(id = "8c71919d-ebb6-467e-866f-0e05509afdde", timestamp = "2017-06-15T13:33:17.691Z", lang = "en", result = result, status = status, sessionId = "somerandomthing")

# ptm <- proc.time(); aiCalc(jsonlite::fromJSON('{"parameters": {"activity_financial": "import", "amount_currency": {"amount": 100, "currency": "GBP"}, "base_currency": "DKK", "date": "2017-12-10"}}')); proc.time() - ptm

# ptm <- proc.time()
# aiCalc()
# proc.time() - ptm

# aiCalc(jsonlite::fromJSON('{"parameters": {"activity_financial": "trade", "amount_currency": {"amount": 100, "currency": "GBP"}, "base_currency": "USD", "date": "2017-12-10"}}'))

#' activity_financial export, import, trade or invest (default export, string)
#' activity date (default now + 7 calendar days, date format "2017-09-10")
