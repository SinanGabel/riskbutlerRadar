library(testthat)
library(stats4)
library(yuima)
library(DBI)
library(RSQLite)
library(radar)

context("radar tests")

test_that("yuima.qmle", {

  set.seed(123)
  ar <- 100*exp(rnorm(100, mean=0, sd=0.10))
  X <- yuima.qmle(data = log(ar), delta = 1, summary = FALSE, drift = "mu * x", diffusion = "sigma * x", method="L-BFGS-B", start = list(mu = 0.10, sigma = 0.1), lower = list(mu = 0, sigma = 0), upper = list(mu = 0.50, sigma = 1))
  X <- stats4::summary(X)
  X <- as.data.frame(X@coef)

  expect_that( abs(X$Estimate[1] - 0.1036490351) < 1e-5, is_true() )
  expect_that( abs(X$Estimate[2] - 0.0002952567) < 1e-5, is_true() )
})

test_that("yuima.simulate", {

  set.seed(123)
  X <- yuima.simulate(setModel(drift = "mu * x", diffusion = "sigma * x"), sumsim = TRUE, nsim = 100, xinit = 100, true.parameter = list(mu = 0.1, sigma = 0.07), sampling = setSampling(Terminal = 1, n = 10))

  expect_that( abs(stats::sd(X) - 353.9682) < 1e-5, is_true() )
  expect_that( abs(mean(X) - 10541.72) < 1e-5, is_true() )
})


test_that("sqliteget", {

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

  expect_that( all.equal(read.csv("./mydata.csv"), sqlite.get(url = "./mydata.db", stmt = "select * from mydata")), is_true() )
})
