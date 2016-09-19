#
# . Arguments are matched first by exact name (perfect matching), then by prefix matching, and finally by position.
#

# . timing
# a way to time an R expression: system.time(...) is preferred, else
#
# ptm <- proc.time()
# for (i in 1:50) mad(stats::runif(500))
# proc.time() - ptm
#

library(testthat)
library(stats4)
library(yuima)
library(DBI)
library(RSQLite)
library(foreach)
library(radar)

context("radar tests")

test_that("yuima.qmle", {

  set.seed(123)
  ar <- 100*exp(rnorm(100, mean=0, sd=0.10))
  X <- yuima.qmle(data = log(ar), delta = 1, summary = FALSE, drift = "mu * x", diffusion = "sigma * x", hurst = 0.5, solve.variable = "x", method="L-BFGS-B", start = list(mu = 0.10, sigma = 0.1), lower = list(mu = 0, sigma = 0), upper = list(mu = 0.50, sigma = 1))
  X <- stats4::summary(X)
  X <- as.data.frame(X@coef)

  expect_that( abs(X$Estimate[1] - 0.1041014143) < 1e-5, is_true() )
  expect_that( abs(X$Estimate[2] - 0.0002923041) < 1e-5, is_true() )
})

##
# . test multivariate too; n > 1;
# . ToDo: specify trading times i.e. the grid => see subsampling()
test_that("yuima.simulate", {

    X <- yuima.simulate(setseed = TRUE, sumsim = FALSE, nsim = 1 , drift = "mu * x", diffusion = "sigma * x", hurst = 0.5, solve.variable = "x",  xinit = 100, parameter = list(mu = 0.1, sigma = 0.07), Terminal = 1, n = 10)

  expect_true( abs(stats::sd(X) - 5.397833) < 1e-2)
  expect_true( abs(mean(X) - 108.1798) < 1e-2)
  expect_true( length(X) == 10)

  X <- yuima.simulate(setseed = TRUE, sumsim = FALSE, nsim = 1 , drift = "mu * x", diffusion = "sigma * x", hurst = 0.5, solve.variable = "x", xinit = 100, parameter = list(mu = 0.1, sigma = 0.07), Terminal = 1, n = 123)
  expect_true( abs(stats::sd(X) - 4.275771) < 1e-2)
  expect_true( abs(mean(X) - 107.0799) < 1e-2)
  expect_true( length(X) == 123)

})


test_that("yuima.qmle.seq", {

  # simulate
  X <- yuima.simulate(setseed = TRUE, sumsim = FALSE, nsim = 1, drift = "mu * x", diffusion = "sigma * x", xinit = 100, hurst = 0.5, solve.variable = "x", Terminal = 1, n = 500, parameter = list(mu = 0.1, sigma = 0.07))

  # estimate once
  est <- yuima.qmle(data = X, delta = 1/500, summary = FALSE, drift = "mu * x", diffusion = "sigma * x", hurst = 0.5, solve.variable = "x", method="L-BFGS-B", start = list(mu = 0.15, sigma = 0.15), lower = list(mu = -0.5, sigma = 0), upper = list(mu = 0.5, sigma = 1))

  est <- as.list(est@coef)

  expect_true( abs(est$mu - 0.1556972) < 1e-3)
  expect_true( abs(est$sigma - 0.06801812) < 1e-3)

  # estimate sequence of windows of length=100 (default) and steps=10 (default)
  est <- yuima.qmle.seq(data = X, delta = 1/500, summary = FALSE, drift = "mu * x", diffusion = "sigma * x", hurst = 0.5, solve.variable = "x", method="L-BFGS-B", start = list(mu = 0.15, sigma = 0.15), lower = list(mu = -0.5, sigma = 0), upper = list(mu = 0.5, sigma = 1))

  expect_true( abs(mean(est[1,]) - 0.06801815) < 1e-3)
  expect_true( abs(mean(est[2,]) - 0.1201217) < 1e-3)

})


test_that("sqlite.sql", {

  # make some data
  mydata <- matrix(100*exp(rnorm(90, mean=0, sd=0.10)),ncol=3)
  colnames(mydata) <- c("High","Low","Close")
  mydata <- as.table(mydata)
  write.csv(mydata, "./mydata.csv", row.names=FALSE)

  # This connection creates an empty database if it does not exist
  db <- dbConnect(RSQLite::SQLite(), dbname = "./mydata.db")

  # write data to disk
  dbWriteTable(conn = db, name = "mydata", value = "./mydata.csv", row.names = FALSE, header = TRUE)
  on.exit(file.remove("./mydata.db"))
  on.exit(file.remove("./mydata.csv"), add = TRUE)
  dbDisconnect(db)

  expect_that( all.equal(read.csv("./mydata.csv"), sqlite.sql(url = "./mydata.db", stmt = "select * from mydata")), is_true() )
})
