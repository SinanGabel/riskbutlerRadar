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
library(stats)
library(jsonlite)
library(stats4)
library(yuima)
library(DBI)
library(RSQLite)
library(foreach)
library(riskbutlerRadar)

context("riskbutlerRadar tests")

test_that("yuima.qmle", {

  set.seed(123)
  ar <- yuima.simulate(setseed = FALSE, sumsim = FALSE, nsim = 1, drift = "mu * x", diffusion = "sigma * x", xinit = 100, hurst = 0.5, solve.variable = "x", Terminal = 1, n = 365, parameter = list(mu = 0.1, sigma = 0.07))
  X <- yuima.qmle(data = ar, delta = 1/365, summary = FALSE, drift = "mu * x", diffusion = "sigma * x", hurst = 0.5, solve.variable = "x", method="L-BFGS-B", start = list(mu = 0.10, sigma = 0.1), lower = list(mu = 0, sigma = 0), upper = list(mu = 0.50, sigma = 1))
  X <- stats4::summary(X)
  X <- as.data.frame(X@coef)

  expect_that( abs(X$Estimate[1] - 0.06774496 ) < 1e-5, is_true() )
  expect_that( abs(X$Estimate[2] - 0.14480042) < 1e-5, is_true() )

  # simulate
  set.seed(123)
  X <- yuima.simulate(setseed = TRUE, sumsim = FALSE, nsim = 1, drift = "mu * x", diffusion = "sigma * x", xinit = 100, hurst = 0.5, solve.variable = "x", Terminal = 1, n = 500, parameter = list(mu = 0.1, sigma = 0.07))

  # estimate once
  est <- yuima.qmle(data = X, delta = 1/500, summary = FALSE, drift = "mu * x", diffusion = "sigma * x", hurst = 0.5, solve.variable = "x", method="L-BFGS-B", start = list(mu = 0.15, sigma = 0.15), lower = list(mu = -0.5, sigma = 0), upper = list(mu = 0.5, sigma = 1))

  est <- as.list(est@coef)

  expect_true( abs(est$mu - 0.1560092) < 1e-3)
  expect_true( abs(est$sigma - 0.06807577) < 1e-3)

  # See below: simulate multi
  # multi
  # yuima.qmle(data = log(X), drift = c("mu1 * x1", "mu2 * x2"), diffusion = matrixc(("s1*x1",0,0,"s2*x2"),2,2), hurst = 0.5, solve.variable = c("x1","x2"), delta=1/500, method= "L-BFGS-B", start = list(mu1 = 0.1, mu2 = 0.2, s1 = 0.07, s2 = 0.17),lower = list(mu1 = 0, mu2 = 0, s1 = 0, s2 = 0),upper = list(mu1 = 1, mu2 = 1, s1 = 1, s2 = 1))

  # correlated
  # yuima.qmle(data = log(X), drift = c("mu1 * x1", "mu2 * x2"), diffusion = matrix(c("s1*x1","s2*x2*r","0","s2*x2*sqrt(1 - r^2)"),2,2), hurst = 0.5, solve.variable = c("x1","x2"), delta=1/500, method= "L-BFGS-B", start = list(mu1 = 0.1, mu2 = 0.2, s1 = 0.07, s2 = 0.17, r=0.5),lower = list(mu1 = 0, mu2 = 0, s1 = 0, s2 = 0, r=-1),upper = list(mu1 = 1, mu2 = 1, s1 = 1, s2 = 1, r=1))

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

  # multi
  # X <- yuima.simulate(setseed = TRUE, sumsim = FALSE, nsim = 1, drift = c("mu1 * x1", "mu2 * x2"), diffusion = matrix(c("s1*x1",0,0,"s2*x2"),2,2), xinit = c(10,100), hurst = 0.5, solve.variable = c("x1","x2"), Terminal = 1, n = 500, parameter = list(mu1 = 0.1, mu2 = 0.2, s1 = 0.07, s2 = 0.17))
  # colnames(X) <- c("V1","V2")  # X[,"V1"]


  # correlated
  # X <- yuima.simulate(setseed = TRUE, sumsim = FALSE, nsim = 1, drift = c("mu1 * x1", "mu2 * x2"), diffusion = matrix(c("s1*x1","s2*x2*r","0","s2*x2*sqrt(1 - r^2)"),2,2), xinit = c(10,100), hurst = 0.5, solve.variable = c("x1","x2"), Terminal = 1, n = 500, parameter = list(mu1 = 0.1, mu2 = 0.2, s1 = 0.07, s2 = 0.17, r = 0.8))
  # Check correlation: plot(X)

})


test_that("yuima.qmle.seq", {

  # simulate
  set.seed(123)
  X <- yuima.simulate(setseed = TRUE, sumsim = FALSE, nsim = 1, drift = "mu * x", diffusion = "sigma * x", xinit = 100, hurst = 0.5, solve.variable = "x", Terminal = 1, n = 500, parameter = list(mu = 0.1, sigma = 0.07))

  # estimate sequence of windows of length=100 (default) and steps=10 (default)
  est <- yuima.qmle.seq(data = X, window = 500, step = 10, delta = 1/500, summary = TRUE, drift = "mu * x", diffusion = "sigma * x", hurst = 0.5, solve.variable = "x", method="L-BFGS-B", start = list(mu = 0.15, sigma = 0.15), lower = list(mu = -0.5, sigma = 0), upper = list(mu = 0.5, sigma = 1))

  expect_true( abs(est$coef$mu - 0.1560092) < 1e-3)
  expect_true( abs(est$coef$sigma - 0.06807577) < 1e-3)

  est <- yuima.qmle.seq(data = X, window = 100, step = 10, delta = 1/500, summary = TRUE, drift = "mu * x", diffusion = "sigma * x", hurst = 0.5, solve.variable = "x", method="L-BFGS-B", start = list(mu = 0.15, sigma = 0.15), lower = list(mu = -0.5, sigma = 0), upper = list(mu = 0.5, sigma = 1))

  expect_true( abs(mean(est$coef$mu) -  0.1213351) < 1e-3)
  expect_true( abs(mean(est$coef$sigma) - 0.06836215) < 1e-3)

  # estimate sequence of windows of length=100 (default) and steps=10 (default)
  est <- yuima.qmle.seq(data = X, window = 125, step = 5, delta = 1/500, summary = TRUE, drift = "mu * x", diffusion = "sigma * x", hurst = 0.5, solve.variable = "x", method="L-BFGS-B", start = list(mu = 0.15, sigma = 0.15), lower = list(mu = -0.5, sigma = 0), upper = list(mu = 0.5, sigma = 1))

  expect_true( abs(mean(est$coef$mu) - 0.1209253) < 1e-3)
  expect_true( abs(mean(est$coef$sigma) - 0.06849526) < 1e-3)

  # ...
  md <- yuima.sde(model = "yckls")
  est <- yuima.qmle.seq(data = X, window = 125, step = 5, delta = 1/500, summary = TRUE, drift = md$drift, diffusion = md$diffusion, hurst = 0.5, solve.variable = "x", method="L-BFGS-B", start = md$slu$start, lower = md$slu$lower, upper = md$slu$upper)

  expect_true( abs(mean(est$coef$p1) + 0.3254493) < 1e-3)
  expect_true( abs(mean(est$coef$p2) - 9.039045) < 1e-3)
  expect_true( abs(mean(est$coef$p3) - 0.5958237) < 1e-3)
  expect_true( abs(mean(est$coef$p4) - 0.6632483) < 1e-3)

  # ...
  json <- readLines("~/git-private/riskbutlerRadar/tests/sde_1.json")
  json <- jsonlite::fromJSON(json)
  est <- yuima.qmle.seq(data = json$data, window = 100, step = 50, delta = 1/500, summary = TRUE, drift = md$drift, diffusion = md$diffusion, hurst = 0.5, solve.variable = "x", method="L-BFGS-B", start = md$slu$start, lower = md$slu$lower, upper = md$slu$upper)

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


test_that("eulerOne", {

  set.seed(123)
  dd <- exp(eulerOne(xinit = log(100), model = "yckls", Terminal = 1, nsim = 100, parameter = list(p1 = -0.03, p2 = 0.11, p3 = 0.2, p4 = 0.1)))

  expect_true( abs(mean(dd) - 119.5292) < 1e-3)
  expect_true( abs(sd(dd) - 25.79993) < 1e-3)

})


test_that("simulate_all", {

  dd <- read.csv("~/git-private/riskbutlerRadar/tests/marketdata_daily_base_DKK.csv")

  set.seed(123)
  sims <- simulate_all(dd$chf, model = "you3", T = 1/12, nsim = 10000, delta = 1/365, estimations = 5)
  expect_true( sum((summary(sims) - as.numeric(c(6.618,   6.835,   6.881,   6.882,   6.929,   7.157)))^2) < 1e-3)

  set.seed(123)
  sims <- simulate_all(dd$chf, model = "yhdf_b2", T = 1/12, nsim = 10000, delta = 1/365, estimations = 5)
  expect_true( sum((summary(sims) - as.numeric(c( 6.573,   6.791,   6.837,   6.838,   6.885,   7.113 )))^2) < 1e-3)


  set.seed(123)
  sims <- simulate_all(dd$sek, model = "you3", T = 1/12, nsim = 10000, delta = 1/365, estimations = 5)
  expect_true( sum((summary(sims) - as.numeric(c(0.7140,  0.7522,  0.7598,  0.7598,  0.7672,  0.7993)))^2) < 1e-3)

  set.seed(123)
  sims <- simulate_all(dd$sek, model = "yhdf_b2", T = 1/12, nsim = 10000, delta = 1/365, estimations = 5)
  expect_true( sum((summary(sims) - as.numeric(c(0.7215,  0.7551,  0.7626,  0.7625,  0.7698,  0.8057 )))^2) < 1e-3)

})



