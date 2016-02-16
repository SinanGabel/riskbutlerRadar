#' sqlite get
#'
#' Connects to db, makes a query to db, closes connection to db
#'
#' Single quotes are used to indicate the beginning and end of a string in SQL
#' Double quotes are preferred in R
#' synchronous: c("off", "normal", "full")
#'
#' @param url sqlite db path
#' @param stmt select statement
#' @return tabular data
#' @export
#'
sqliteget <- function(url = "////abs_path/my.db", stmt = 'SELECT * FROM stdin LIMIT 100') {
  con <- dbConnect(RSQLite::SQLite(), url, loadable.extensions = TRUE , flags = SQLITE_RO, synchronous = "full")
  res <- dbGetQuery(conn = con, statement = stmt)
  dbDisconnect(con)
  return(res)
}

