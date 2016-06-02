"use strict";

// --- r-code.js ---

/*
  . warning: https is necessary here

  . warning: on local machine e.g. Mac set in .htaccess file => Header set Access-Control-Allow-Origin "*"

*/
//ocpu.seturl("https://riskbutler.net/ocpu/github/sinangabel/radar/R");


// --- global vars ---

var 

data_all = [],

isin_all = {},

daysofweek = {0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };



/*

 . Afdragsfrit: {repayment_spec: "Optional repayment"} else "Normal"



*/
var static_codes = [

 {
isin: "DK0009273419",
name: "REALKREDIT DANMARK 73D CF 2038",
name2: "RD73D5CF 38",
issuer: "Realkredit Danmark A/S",
coupon: 0.93,
coupon_fixed: false,
coupon_date: null,
listing: "2005-04-22",
expiry: "2038-01-01",
base: "DKK",
bond_type:	"RO",
loan_type:	"Annuity loan with partial amortization",
repayment_spec: "Normal",
repayment_profile:	"Annuity loan",
callable: true },

 {
isin: "DK0009797599",
name: "2,5NYK03D A47",
name2: "2,5NYK03D A47",
issuer: "Nykredit Realkredit A/S",
coupon: 2.5,
coupon_fixed: true,
coupon_date: null,
listing: "2014-09-10",
expiry: "2047-10-01",
base: "DKK",
bond_type:	"Nominal bond",
loan_type:	"Annuity loan with partial amortization",
repayment_spec: "Normal",
repayment_profile:	"Annuity loan",
callable: true },

 {
isin: "DK0009292559",
name: "2,5RDSDRO23S47",
name2: "2,5RDSDRO23S47",
issuer: "Realkredit Danmark A/S",
coupon: 2.5,
coupon_fixed: true,
coupon_date: null,
listing: "2014-08-20",
expiry: "2047-10-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Annuity loan with partial amortization",
repayment_spec: "Normal",
repayment_profile:	"Annuity loan",
callable: true },

 {
isin: "DK0009798647",
name: "2NYK01E A37",
name2: "2NYK01E A37",
issuer: "Nykredit Realkredit A/S",
coupon: 2,
coupon_fixed: true,
coupon_date: null,
listing: "2014-09-01",
expiry: "2037-10-01",
base: "DKK",
bond_type:	"SDO",
loan_type:	"Annuity loan with partial amortization",
repayment_spec: "Normal",
repayment_profile:	"Annuity loan",
callable: true },

{
isin: "DK0009292633",
name: "2,0RDSDRO22S37",
name2: "2,0RDSDRO22S37",
issuer: "Realkredit Danmark A/S",
coupon: 2,
coupon_fixed: true,
coupon_date: null,
listing: "2014-08-27",
expiry: "2037-10-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Annuity loan with partial amortization",
repayment_spec: "Normal",
repayment_profile:	"Annuity loan",
callable: true },

{
isin: "DK0009798217",
name: "15NYK01E A32",
name2: "15NYK01E A32",
issuer: "Nykredit Realkredit A/S",
coupon: 1.5,
coupon_fixed: true,
coupon_date: null,
listing: "2014-09-01",
expiry: "2032-10-01",
base: "DKK",
bond_type:	"SDO",
loan_type:	"Annuity loan with partial amortization",
repayment_spec: "Normal",
repayment_profile:	"Annuity loan",
callable: true },

{
isin: "DK0009293284",
name: "1,5RDSDRO21S32",
name2: "1,5RDSDRO21S32",
issuer: "Realkredit Danmark A/S",
coupon: 1.5,
coupon_fixed: true,
coupon_date: null,
listing: "2014-09-03",
expiry: "2032-10-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Annuity loan with partial amortization",
repayment_spec: "Normal",
repayment_profile:	"Annuity loan",
callable: true }

];