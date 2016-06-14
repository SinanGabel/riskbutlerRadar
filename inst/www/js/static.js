"use strict";

// --- r-code.js ---

/*
  . warning: https is necessary here

  . warning: on local machine e.g. Mac set in .htaccess file => Header set Access-Control-Allow-Origin "*"

*/
ocpu.seturl("https://riskbutler.net/ocpu/github/sinangabel/radar/R");


// --- global vars ---

var 

data_all = [],  // all transactions data per ISIN & date

isin_all = {},  // all {isin:names, ...} in transactions data

daysofweek = {0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" },

r_width = 480,
r_height = 300;


//...
function diagramSize(size) {

    var size = size || document.getElementById("diagram-size").value;

	switch (size) {
	  case "small":
		r_width = 480,
		r_height = 300;
		break;
	  case "medium":
		r_width = 720,
		r_height = 450;
		break;
	  case "large":
		r_width = 960,
		r_height = 600;
		break;
	  default:
		console.log('default width and height');
	}
}


/*
 . static data

 . Afdragsfrit: {repayment_spec: "Optional repayment"} else "Normal"

 . 16 ISIN codes

*/
var static_codes = [
 {
isin: "DK0009297350",
name: "2RDSD27SOA47",
name2: "2RDSD27SOA47",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
coupon: 2,
coupon_fixed: true,
coupon_date: null,
listing: "2014-06-20",
expiry: "2047-10-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Annuity loan with partial amortization",
repayment_spec: "Optional repayment",
repayment_profile:	"Annuity loan",
callable: true },

 {
isin: "DK0009296030",
name: "1RD10F22JARF",
name2: "1RD10F22JARF",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
coupon: 1,
coupon_fixed: true,
coupon_date: null,
listing: "2015-01-02",
expiry: "2022-01-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Bullet loan",
repayment_spec: "Normal",
repayment_profile:	"Bullet loan",
callable: false },

 {
isin: "DK0009292476",
name: "3RDSDRO27SOA47",
name2: "3RDSDRO27SOA47",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
coupon: 3,
coupon_fixed: true,
coupon_date: null,
listing: "2014-06-20",
expiry: "2047-10-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Annuity loan with partial amortization",
repayment_spec: "Optional repayment",
repayment_profile:	"Annuity loan",
callable: true },

 {
isin: "DK0009277089",
name: "4% REALKREDIT DANMARK 10S SDRO 2",
name2: "4RD10S 18",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
coupon: 4,
coupon_fixed: true,
coupon_date: null,
listing: "2007-07-13",
expiry: "2018-01-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Bullet loan",
repayment_spec: "Normal",
repayment_profile:	"Bullet loan",
callable: false },

 {
isin: "LU1153685679",
name: "1RD10G19JARF",
name2: "1RD10G19JARF",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
coupon: 1,
coupon_fixed: true,
coupon_date: null,
listing: "2015-01-02",
expiry: "2019-01-01",
base: "EUR",
bond_type:	"SDRO",
loan_type:	"Bullet loan",
repayment_spec: "Normal",
repayment_profile:	"Bullet loan",
callable: false },

 {
isin: "DK0009299133",
name: "RD11F6JU19RF",
name2: "RD11F6JU19RF",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
coupon: 0.16,
coupon_fixed: false,
coupon_date: null,
listing: "2015-06-29",
expiry: "2019-07-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Hybrid",
repayment_spec: "Optional repayment",
repayment_profile:	"Hybrid",
callable: false },

 {
isin: "DK0009285694",
name: "RD 33S.S.CF.OA 2021",
name2: "RD33SSCFOA 21",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
coupon: 0.48,
coupon_fixed: false,
coupon_date: null,
listing: "2011-09-09",
expiry: "2021-10-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Annuity loan with partial amortization",
repayment_spec: "Deferred amortization",
repayment_profile:	"Annuity loan",
callable: true },

 {
isin: "DK0009285504",
name: "RD 32S.S.S.CF 2021",
name2: "RD32SSCF 21",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
coupon: 0.48,
coupon_fixed: false,
coupon_date: null,
listing: "2011-09-09",
expiry: "2021-10-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Annuity loan with partial amortization",
repayment_spec: "Normal",
repayment_profile:	"Annuity loan",
callable: true },

 {
isin: "DK0009280976",
name: "4% REALKREDIT DANMARK 10S INK SD",
name2: "4RD10S 20",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
coupon: 4.0,
coupon_fixed: true,
coupon_date: null,
listing: "2009-05-01",
expiry: "2020-01-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Bullet loan",
repayment_spec: "Normal",
repayment_profile:	"Bullet loan",
callable: false },

 {
isin: "DK0009294092",
name: "1RD10F17APRF",
name2: "1RD10F17APRF",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
coupon: 1.0,
coupon_fixed: true,
coupon_date: null,
listing: "2015-01-02",
expiry: "2017-04-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Bullet loan",
repayment_spec: "Normal",
repayment_profile:	"Bullet loan",
callable: false },

 {
isin: "DK0009291072",
name: "11T 6F+15 OA2016",
name2: "11T 6F+15 OA2016",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
coupon: 0,
coupon_fixed: true,
coupon_date: null,
listing: "2013-10-17",
expiry: "2016-07-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Hybrid",
repayment_spec: "Optional repayment",
repayment_profile:	"Hybrid",
callable: false },

 {
isin: "DK0009292989",
name: "1,0RDSDRO20S27",
name2: "1,0RDSDRO20S27",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
coupon: 1.0,
coupon_fixed: true,
coupon_date: null,
listing: "2014-09-03",
expiry: "2027-10-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Annuity loan with partial amortization",
repayment_spec: "Normal",
repayment_profile:	"Annuity loan",
callable: true },

 {
isin: "DK0009297517",
name: "0,5RDSD20S27",
name2: "0,5RDSD20S27",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
coupon: 0.50,
coupon_fixed: true,
coupon_date: null,
listing: "2015-01-13",
expiry: "2027-10-01",
base: "DKK",
bond_type:	"SDRO",
loan_type:	"Annuity loan with partial amortization",
repayment_spec: "Normal",
repayment_profile:	"Annuity loan",
callable: true },

 {
isin: "DK0009273419",
name: "REALKREDIT DANMARK 73D CF 2038",
name2: "RD73D5CF 38",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
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
issuer_short: "NYK",
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

// DK0009292559 is renamed to DK0009292599
 {
isin: "DK0009292599",
name: "2,5RDSDRO23S47",
name2: "2,5RDSDRO23S47",
issuer: "Realkredit Danmark A/S",
issuer_short: "RD",
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
issuer_short: "NYK",
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
issuer_short: "RD",
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
issuer_short: "NYK",
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
issuer_short: "RD",
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