#' Forecast of chance of profit and risk of loss for api.ai (this) updown financial activity agent
#'
#' Todo: use cron to pre-generate the most used data including the FX so-called majors, once per hour
#'
#' @param result list of data from api.ai
#' @return list
#' @export
#'
aiUpdown <- function(result) {

  if (missing(result)) {
    result <- jsonlite::fromJSON('{"parameters": {"activity_financial": "import", "amount_currency": {"amount": 100, "currency": "GBP"}, "base_currency": "DKK", "date": "2017-12-10"}}')
  }

  api <- result$parameters
  info <- "Info: sinan.gabel@riskbutler.com"

  # temporary
  base_currency <- api$base_currency
  currency <- api$amount_currency$currency
  symbol <- paste(base_currency, currency, sep = "")
  #symbol_t <- paste(currency, base_currency, sep = "")

  if (base_currency == currency) {

    txt <- jsonlite::unbox(paste("There is no foreign exchange risk on your", api$activity_financial, "activity because the base currency", base_currency, " and activity currency", currency, " are the same.", info))

  } else {

    ## . Check if results are already calculated and stored, else make new simulations; check if result and all parameters are there and correct;
    recalculate <- TRUE
    db <- "/var/sql/rdata.db"
    sql <- sqlite.sql(url = db, stmt = paste('select * from fx where name = "', symbol, '" order by date desc limit 1', sep = ""))
    #sql <- sqlite.sql(url = db, stmt = paste('select * from fx where name in ( "', symbol, '", "', symbol_t ,'") order by date desc limit 1', sep = ""))

    if (nrow(sql) > 0) {

      json <- jsonlite::fromJSON(sql$est)

      if ((as.POSIXct(json$time) + 3600) > Sys.time()) {
        recalculate <- FALSE
        xinit <- json$price
        up <- json$up
        down <- json$down
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

    # Import and buy-side of trade will loose on FX changes if rate goes up, and vice versa for sell-side
    txt_ext <- ""
    if (api$activity_financial == "import") {
      tmp <- up
      up <- down
      down <- tmp
    } else if (api$activity_financial == "invest" | api$activity_financial == "trade") {
      txt_ext <- paste("For the buy-side of the", api$activity_financial, "activity: ")
      tmp <- up
      up <- down
      down <- tmp
    }

    txt <- jsonlite::unbox(paste(txt_ext, "Due to foreign exchange changes, the 30 day chance of profit is", format(up * 100, digits = 2), "percent and the risk of loss is", format(down * 100, digits = 2), "percent of the", api$activity_financial, "activity amount. The latest foreign exchange price is", base_currency, format(xinit, digits = 4), "=", currency, "1.0000.", info))

  }

  # result
  return(list(speech = txt, displayText = txt, source = jsonlite::unbox("riskbutler.net")))
}


#' Note: only FX currently, and risk time horizon 1 calendar week (7 days), data is hourly, 10000 simulations, quantiles are 1 and 99 percent, market data window is 252



# Call from api.ai is something like
# aiUpdown(id = "8c71919d-ebb6-467e-866f-0e05509afdde", timestamp = "2017-06-15T13:33:17.691Z", lang = "en", result = result, status = status, sessionId = "somerandomthing")

# ptm <- proc.time(); aiUpdown(jsonlite::fromJSON('{"parameters": {"activity_financial": "import", "amount_currency": {"amount": 100, "currency": "GBP"}, "base_currency": "DKK", "date": "2017-12-10"}}')); proc.time() - ptm

# ptm <- proc.time()
# aiUpdown()
# proc.time() - ptm



#' activity_financial export, import, trade or invest (default export, string)
#' activity date (default now + 7 calendar days, date format "2017-09-10")
