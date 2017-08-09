#' Gets daily historical equity market data from Google Finance
#'
#' Fields: Date, Open, High, Low, Close, Volume (latest first)
#' Original source: https://github.com/rwebapps/stockapp
#'
#' @param ticker string
#' @param exchange string
#' @param from date
#' @param to date
#' @return data.frame
#' @export
#'
googleData <- function(ticker, exchange, from, to){
  from <- as.Date(from)
  to <- as.Date(to)

  args <- list(
    startdate = as.character(from),
    enddate = as.character(to),
    q = ticker,
    x = exchange,
    output = "csv"
  )

  myurl <- paste0("https://www.google.com/finance/historical?", paste(names(args), args, sep="=", collapse="&"))

  # unique tmp file name
  tmp <- tempfile()
  on.exit(unlink(tmp))
  curl::curl_download(myurl, tmp)
  mydata <- read.csv(tmp, stringsAsFactors = FALSE)

  # Seems that google returns string like "22-Sep-16" at least on my machine
  mydata$Date <- as.Date(strptime(mydata$Date, "%d-%b-%y"))

  return(mydata);
}


# googleData("GOOG", "NASDAQ", "2017-01-01", as.character(Sys.Date()))
# googleData("IBM", "NYSE", "2017-01-01", as.character(Sys.Date()))
# ptm <- proc.time(); jsonlite:toJSON(googledata("IBM","NYSE", "2017-01-01", as.character(Sys.Date()))); proc.time() - ptm;
# Can also call as: q=NASDAQ:AAPL

# ToDo: add parameter to control what to get= d, o, h, l, c, v

# https://www.google.com/finance/historical?startdate=%222017-01-01%22&enddate=%222017-07-03%22&q=GOOG&x=NASDAQ&output=csv
# https://www.google.com/finance/historical?startdate=%222017-01-01%22&enddate=%222017-07-03%22&q=IBM&x=NYSE&output=csv
