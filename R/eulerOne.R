#' A univariate euler simulation function for Chan et al. 1992 Stochastic Differential Equation
#'
#' It can be updated to take any kind of SDE model
#' Simulates only at the (future) Terminal (trading time) point
#'
#'
#' @param xinit initial value vector of state variables (default 1, number)
#' @param Terminal (default 1 (year), positive number)
#' @param nsim number of simulations (default 10, integer)
#' @param parameter named list of parameters
#' @return simulations
#' @export
#'
eulerOne <- function (xinit = 1, Terminal = 1, nsim = 10,
                      parameter = list(p1 = -0.04, p2 = 0.1, p3 = 0.23, p4 = 0.5)) {

  drift <- substitute(p1 * (p2 - x), parameter)
  diffusion <- substitute(p3 * x ^ p4, parameter)

  d1 <- function(x)
    eval(drift)
  s1 <- function(x)
    eval(diffusion)

  dt <- Terminal

  d2 <- xinit + d1(xinit) * dt
  s2 <- s1(xinit) * sqrt(dt)

  Z <- stats::rnorm (nsim)
  return(d2 + s2 * Z)
}




#' How to use =>
#'
#' library(jsonlite)
#' library(riskbutlerRadar)
#'
#' #dd <- fromJSON("https://riskbutler.net/fx1openx")
#'
#' #' Google data: source: opencpu.org
#' #'
#' #' Download historical prices for a given stock from Google
#' #'
#' #' @param ticker stock ticker symbol. E.g. "GOOG".
#' #' @param from start date. Either string or date object.
#' #' @param to end date. Either string or date object.
#' #' @return dataframe with historical prices
#' #' @export
#' googledata <- function(ticker, from, to){
#'   from <- as.Date(from)
#'   to <- as.Date(to)
#'
#'   args <- list(
#'     q = ticker,
#'     output = "csv",
#'     startdate = as.character(from),
#'     enddate = as.character(to)
#'   )
#'
#'   myurl <- paste0("https://www.google.com/finance/historical?",
#'                   paste(names(args), args, sep="=", collapse="&"))
#'
#'   tmp <- tempfile()
#'   on.exit(unlink(tmp))
#'   curl::curl_download(myurl, tmp)
#'   mydata <- read.csv(tmp, stringsAsFactors = FALSE)
#'
#'   # Seems that google returns string like "22-Sep-16" at least on my machine
#'   mydata$Date <- as.Date(strptime(mydata$Date, "%d-%b-%y"))
#'
#'   return(mydata);
#' }
#'
#' ptm <- proc.time()
#'
#' dd <- googledata("GOOG", "2015-01-01", as.character(Sys.Date()))
#'
#' xdata <- rev(dd$Close)
#'
#' # ycks model 3
#' js <- fromJSON('{"start": {"p1": 1,"p2": 0.1,"p3": 0.1,"p4": 1}, "lower": {"p1": -100,"p2": 0,"p3": 0,"p4": 0}, "upper": {"p1": 100,"p2": 100,"p3": 1,"p4": 2}}')
#'
#' ptm <- proc.time()
#' win_less <- 4
#' qmle_step <- 2
#' est <- yuima.qmle.seq(data = log(xdata), window = length(xdata) - win_less, step = qmle_step, delta = 1/252, drift = "p1 * (p2 - x)", diffusion = "p3 * x^p4", hurst = 0.5, solve.variable = "x", method="L-BFGS-B",  start = js$start, lower = js$lower, upper = js$upper)
#' proc.time() - ptm
#'
#' est$coef
#'
#' ptm <- proc.time()
#' coef_i <- win_less/qmle_step + 1
#' sims <- exp(eulerOne(xinit = log(xdata[length(xdata)]), Terminal = 5/252, nsim = 1000, parameter = list(p1 =est$coef$p1[coef_i], p2 = est$coef$p2[coef_i], p3 = est$coef$p3[coef_i], p4 = est$coef$p4[coef_i])))
#' proc.time() - ptm



