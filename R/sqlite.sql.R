#' sqlite sql
#'
#' Connects to db, makes a query to db, closes connection to db
#'
#' Single quotes are used to indicate the beginning and end of a string in SQL
#' Double quotes are preferred in R
#' synchronous: c("off", "normal", "full")
#'
#' To retrieve results a chunk at a time, use dbSendQuery, dbFetch, then ClearResult. Alternatively, if you want all the results (and they'll fit in memory) use dbGetQuery which sends, fetches and clears for you.
#'
#' @param url sqlite db path e.g. "/abs_path/my.db"
#' @param stmt sql statement e.g. "SELECT * FROM stdin LIMIT 100"
#' @return tabular data
#' @export
#'
sqlite.sql <- function(url, stmt) {
  con <- RSQLite::dbConnect(RSQLite::SQLite(), dbname = url)
  on.exit(RSQLite::dbDisconnect(con))
  RSQLite::dbGetQuery(conn = con, statement = stmt)
}

# curl 'https://riskbutler.net/ocpu/github/sinangabel/radar/R/sqlite.sql/json' -H "Content-Type: application/json" -d '{"url": "/home/ubuntu/sql/ecb.db", "stmt": "SELECT * FROM stdin where \"code\"=\"DKK\" LIMIT 10" }'
