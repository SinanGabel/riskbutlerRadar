#' sqlite get
#'
#' Connects to db, makes a query to db, closes connection to db
#'
#' Single quotes are used to indicate the beginning and end of a string in SQL
#' Double quotes are preferred in R
#' synchronous: c("off", "normal", "full")
#'
#' To retrieve results a chunk at a time, use dbSendQuery, dbFetch, then ClearResult. Alternatively, if you want all the results (and they'll fit in memory) use dbGetQuery which sends, fetches and clears for you.
#'
#' @param url sqlite db path
#' @param stmt select statement
#' @return tabular data
#' @export
#'
sqliteget <- function(url = "/abs_path/my.db", stmt = "SELECT * FROM stdin LIMIT 100") {
  con <- RSQLite::dbConnect(RSQLite::SQLite(), dbname = url)
  res <- RSQLite::dbGetQuery(conn = con, statement = stmt)
  RSQLite::dbDisconnect(con)
  return(res)
}

# curl 'https://riskbutler.net/ocpu/github/sinangabel/radar/R/sqliteget/json' -H "Content-Type: application/json" -d '{"url": "/home/ubuntu/sql/ecb.db", "stmt": "SELECT * FROM stdin where \"code\"=\"DKK\" LIMIT 10" }'
