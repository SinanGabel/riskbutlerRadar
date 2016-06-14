"use strict";


/*
  . id: DOM id
  . m: matrix
  . ToDo: possibility to format numbers
  .    . add thead
       . add class as parameter
*/
function makeTable(id, m, html_cols) {

	var table = document.createElement("table"),
	    tb = document.createElement("tbody"),
		tr, td, trs,
		i=0, j=0,
		l=m.length, ll=0;

	for (i = 0; i < l; i++) {
		tr = document.createElement("tr");
		trs = ([i]).concat(m[i]);  // i is a row counter
		ll = trs.length;
		
		for (j = 0; j < ll; j++) {
		   td = document.createElement("td");
		   
		   if (html_cols !== undefined && html_cols.indexOf(j) !== -1) {

		       td.innerHTML = trs[j];		   
		   } else {
		       td.textContent = trs[j];
		   }
		   
		   tr.appendChild(td);
		}
		tb.appendChild(tr);
	}
	table.appendChild(tb);
	
	// if l>2500 td: padding 6px
	if (l < 2500) {table.setAttribute("class", "pure-table pure-table-striped"); }
	document.getElementById(id).appendChild(table);
}


/*
   --- About time ---
 
 . A date e.g. "2016-05-12" without a Z is interpreted as local time in ES6
 . The dates from NASDAQ are in local time
 
 . data: [obj, obj, ...]
 
 . Firefox returns: 2016-02-17T15:06:32.000Z which is a UTC time
 . Safari and Chrome returns: Wed Feb 17 2016 16:06:32 GMT+0100 (CET) 
 
*/
function convertDateTime(data, key) {

    data.forEach(function(v) {
	    v[key] = new Date((v[key]).replace(/-/g, "/"));
		return v; 
	});
}


/*
 . data: [obj, obj, ...]
 
 . (1) RD & ISIN
 . (2) ! RD & ISIN
 . (3) RD & ! ISIN
 . (4) ! RD & ! ISIN
*/ 
function addColorAccessor(data, isin, issuer) {

    issuer = issuer || "RD";

    data.forEach(function(d) {
    
        if (d.ISIN === isin) {  
        
            d.cat = (d.buyer === issuer || d.seller === issuer) ? 1 : 2 ;
            
        } else {
            
            d.cat = (d.buyer === issuer || d.seller === issuer) ? 3 : 4 ;
        }
    });
}


// ToDo: check UTC
function someWeekDays(from, n) {

    from = from || _.now();
    n = n || 5;
    
    // add two for weekend effect
    return _.map(_.last(weekdays(from - 86400000 * (n + 2), from), n), function(d) {var dd = new Date(d); return daysofweek[dd.getDay()] + " " + dd.toJSON().substr(0,10); });
}


// ...
function setToFrom(day) {
  
  if (_.isEmpty(day)) {return; }
  
  document.getElementById("date-from").value = day;
  document.getElementById("date-to").value = day;
}

// ...
function getToFrom() {

  var from = document.getElementById("date-from").value,
      to = document.getElementById("date-to").value, 
      
      d1 = 0, d2 = 0;
        
  // Make select statements
  if (from === "" && to === "") {
      
      tekst("warning", "p", "Please make a date selection!");
      return [];
  
  } else {
  
      from = (from === "") ? "1970-01-01" : from;
      to = (to === "") ? "2099-01-01" : to;
      
      // check figures
      // These are just to compare times so there is no issue of local time or UTC time
      d1 = (new Date(from)).getTime();
      d2 = (new Date(to)).getTime();
      if (d1 > d2) {
          tekst("warning", "p", "Date selection error: Please select a From date that is before the To date!");
          return [];
      }
  
      return (d1 === d2) ? [from] : [from, to] ;
  }    
}


// --- other ---

/*
 . See also: http://charts.animateddata.co.uk/uktemp/
 
*/
function mgDiagram(id, type, data, isin, baseln) {

    diagramSize();

    var stic = _.findWhere(static_codes, {"isin": isin}),
   
       json = {
		  title: stic.name2 + " Price",
		  description: stic.name + " " + isin + " price development",
  
		  data: data,
		  chart_type: type,
		  width: r_width,
		  height: r_height,
  
		  target: document.getElementById(id),
		  x_accessor: "Time",
		  y_accessor: ["Price"],
		  
          baselines: baseln,

          x_mouseover: function(d) {return d.Time + "  "; },
          y_mouseover: function(d) {return ((d.ISIN === isin) ? "" : (" " + d.Name + " " + d.ISIN)) + " P:" + d.Price + " B: " + d.buyer + " S: " + d.seller + " Diff: " + (d.diff).toFixed(2); },
		  
		  show_secondary_x_label: true,
		  min_y_from_data: true,
		  decimals: 5,
  
		  yax_format: d3.format('.4s'),
		  y_rug: true,
		  linked: true };
  
    // ...
    if (type === "line") {
    
        json.area = false;
    
    } else if (type === "point" && data.length > 20 ) {

        json.least_squares = true;
    
    } else if (type === "point-size") {
  
      json.title = stic.name2 + " Price & Volume";
      json.description = stic.name + " " + isin + " price & volume development";


      json.size_accessor = "Volume";
      json.size_range = [1,40];      

      json.y_mouseover = function(d) {return " P:" + d.Price + " B: " + d.buyer + " S: " + d.seller + " V: " + (d.Volume).toLocaleString() ; };

    }

    // ...
    if (type === "point-group" || type === "point-size") {

      // ...
      json.chart_type = "point";

      addColorAccessor(data, isin);  
      
      json.color_accessor = "cat";
      json.color_domain = [1,2,3,4];
      json.color_range = ["red", "blue", "green", "grey"];
    }  

    json.data = data;

    // ...
    MG.data_graphic(json); 
}


// ...
function mgHistogram(id, data, isin, accessor, marker) {

    diagramSize();

    var bins = 0,
        stic = _.findWhere(static_codes, {"isin": isin});

    //if (data.length < 5) {return;}
    
    // bins
    bins = (data.length < 30) ? 20 : 40; 

	MG.data_graphic({
		title: stic.name2 + " " + accessor,
		description: accessor + " histogram",

		data: data,
		chart_type: "histogram",
		width: r_width,
		height: r_height,

		//right: 10,
		bins: bins,
		bar_margin: 0,
		
		markers: marker,

		target: "#" + id,

		y_extended_ticks: true,
		xax_format: d3.format('.4s'),
		
		mouseover: function(d, i) {
			d3.select("#" + id + " svg .mg-active-datapoint")
			  .text(accessor + " : [ " + (d.x).toFixed(2) + ", " + (d.x + d.dx).toFixed(2) +  " ]  Count: " + d.y);
		}
	});
}

/*
  . ["isin", "name", "name2", "issuer", "coupon", "coupon_fixed", "coupon_date", "listing", "expiry", "base", "bond_type", "loan_type", "repayment_spec", "repayment_profile", "callable"]

*/
function tableStatic(id, data) {

/*
    MG.data_table({
        title: "Statistics",
        description: "Table of numbers",
        data: data
    })
    .target("#" +  id)
    .text({ accessor: "base", label: "Currency"})
    .text({ accessor: "expiry", label: "Expiry"})
    .text({ accessor: "coupon", label: "Coupon"})
    .text({ accessor: "coupon_fixed", label: "Fixed", color: function(d) {return d === true ? "auto" : "blue"; }})
    .text({ accessor: "name", label: "Name"})
    .text({ accessor: "isin", label: "ISIN"})
    .text({ accessor: "issuer_short", label: "Issuer", color: function(d) {return d === "RD" ? "red" : "auto"; }})
    .text({ accessor: "callable", label: "Callable"})
    .text({ accessor: "bond_type", label: "Bond type"})
    .text({ accessor: "loan_type", label: "Loan type"})
    .text({ accessor: "repayment_spec", label: "Repayment spec"})
    .text({ accessor: "repayment_profile", label: "Repayment profile"})
    .display();
*/    
    
    makeTable(id, ([["Currency", "Expiry", "Coupon", "Fixed", "Name", "ISIN", "Issuer", "Callable", "Bond type", "Loan type", "Repayment spec", "Repayment profile"]]).concat(
    
      _.map(data, function(d) {return [d.base, d.expiry, d.coupon, d.coupon_fixed, d.name, d.isin, d.issuer_short, d.callable, d.bond_type, d.loan_type, d.repayment_spec, d.repayment_profile]; })
    
    ));

}

// ...
function tableStats(id, data) {

    MG.data_table({
        title: "Statistics",
        description: "Table of numbers",
        data: (_.sortBy(data, "range")).reverse()
        //show_tooltips: true
    })
    .target("#" +  id)
    .text({ accessor: "name", label: "Name"})
    .text({ accessor: "isin", label: "ISIN"})
    .number({ accessor: "range", label: "Range", round: 2})
    //.text({ accessor: "mode", label: "Mode", color: "blue"})
    .number({ accessor: "min", label: "Min", round: 2})
    .number({ accessor: "vwap", label: "Mean*", color: "blue", round: 2})
    //.number({ accessor: "median", label: "Median", round: 2})
    .number({ accessor: "max", label: "Max", color: "gray", round: 2})
    .number({ accessor: "vol", label: "Volatility", round: 2})
    .number({ accessor: "length", label: "Count", color: "gray"})
    .display();

}


/*
 . 
  
*/ 
function checkStaticData() {

    var keys_in_data = [],
        diff = [];
    
    // continue
    keys_in_data = _.keys(isin_all);
    
    // For test: in PRODUCTION remove this
    keys_in_data.push("DK00TESTONLY");

    diff = _.difference(keys_in_data, _.pluck(static_codes, "isin"));

    tekst("warning", "p", "No static data for ISIN codes: " + JSON.stringify(diff)); 
    
    return diff;
}


/*
 . bonds()

 . move this later

 . Add ordering: Use JQuery UI => Sortable
  
*/ 
function sortBonds(order) {

        // These must be part of static_codes
        order = order || ["base", "expiry", "coupon_fixed", "coupon", "issuer_short", "callable"];

        var data = [],
            keys_in_data = [];   
        
        // ...
        keys_in_data = _.keys(isin_all);
        
        data = _.chain(static_codes)
         .filter(function(d) {return keys_in_data.indexOf(d.isin) !== -1; })
         .map(function(d) {d.group = (_.values(_.pick(d, order))).join(""); return d; })
         .sortBy(function(d) {return d.group  })
         .value();  
                  
        tableStatic("table-1", data);
}


/*
 . bonds()
 
 . warning: this changes static_codes

 . move this later

 . Add ordering: Use JQuery UI => Sortable
  
*/ 
function xgroupBonds(order) {

        // These must be part of static_codes
        order = order || ["base", "expiry_year", "coupon_fixed", "coupon", "callable"];

        var keys_in_data = [];   
        
        // ...
        keys_in_data = _.keys(isin_all);
        
        return _.chain(static_codes)
         .filter(function(d) {return keys_in_data.indexOf(d.isin) !== -1; })
         .map(function(d) {d.expiry_year = (d.expiry).substr(0,4); d.group = (_.values(_.pick(d, order))).join(""); return d; })
         //.groupBy(function(d) {return d.group; })  // change txt key to sort differently
         //.values()
         //.flatten()
         .value();
}


/*
 . Call as: getBondGroup("DK0009798217") 
 
 . Warning: this requires that static_codes have key "group"

*/
function getBondGroup(isin) {
    return _.where(static_codes, {"group": _.findWhere(static_codes, {"isin": isin}).group});
}


/*
 . _.pluck(getBondGroup("DK0009292599"),"isin")  =>  ["DK0009797599", "DK0009292599"]

*/
function getBondGroupData(isin) {

    var isins = [];

    isins = _.pluck(getBondGroup(isin), "isin")
    
    return _.filter(data_all, function(v) {return isins.indexOf(v.ISIN) !== -1; });
}


// ...
function tableTransactions(id, data) {

	  MG.data_table({
			title: "A table",
			description: "A table",
			data: data
			//show_tooltips: true
		})
        .target("#" +  id)
		.number({accessor: "counter", label: "Row"})
		.number({ accessor: 'Time', label: 'Time'})
		.number({ accessor: 'Price', label: 'Price', color: "blue"})
		.text({ accessor: 'Name', label: 'Name'})
		.text({accessor: "ISIN", label: "ISIN", color: "gray"})
		//.number({ accessor: 'Price_old', label: 'Last'})
		.number({ accessor: 'Volume', label: 'Volume'})
		.text({ accessor: 'buyer', label: 'Buyer', color: function(d) {return d === "RD" ? "red" : "auto"; }})
		.text({ accessor: 'seller', label: 'Seller', color: function(d) {return d === "RD" ? "red" : "auto"; }})
		.display();  

}


/*
 . vwap(d, "Price", "Volume")

 . https://en.wikipedia.org/wiki/Volume-weighted_average_price
 
 . format d: [{},{},...]
 
 . returns a number
 
   vwap([{p: 100, v: 100}], "p", "v")  => 100
   vwap([{p: 100, v: 1},{p: 1000, v: 2}], "p", "v")  => 700
   
 . warning: It is assumed that all volumes v > 0
 
*/
function vwap(d, p, v) {
 
    if (_.isEmpty(d)) {return; } 
 
    var q = [], ar = [];
    
    q = _.pluck(d, v);
    
    ar = _.map(d, function(d) {return d[p] * d[v];});

    return math.sum(ar)/math.sum(q);
}


// ...
function stats(ar) {

    var min=0, max=0, mode = [];

	if (_.isEmpty(ar)) {
	
		//return {length: 0, mean: null, min: null, max: null, range: null, vol: null };
	    return {};
	
	} else {

		min = math.min(ar);
		max = math.max(ar);
		mode = math.mode(ar);
		
		//mode = (mode.length > 1) ? JSON.stringify(mode) : ("" + mode[0] + "") ;

		return {length: ar.length, mean: math.mean(ar), median: math.median(ar), min: min, max: max, range: max - min, vol: math.std(ar) };
    }
}


// ...
function updateDateButtons(ar) {

    ar = ar || someWeekDays();

    // date buttons
    ar = _.map(ar, function(d) {return '<button class="pure-button" type="button" onclick="setToFrom(\'' + d.substr(-10) + '\');">' + d + '</button>'; });
    document.getElementById("date-buttons").innerHTML = '<label>5 days</label>' + ar.join(" ");

}

/*
 . Initial UX update
*/
function uxInit() {

    setAction("System upstart!", false, 0.8);

    var ar = [],
        day = "",
        clearUX = _.after(2, clearAction);    
    
    // ...
    ar = someWeekDays();
    day = (ar[ar.length -1]).substr(-10);
        
    // get data for the latest weekday
	sqliteSQL({"url": "/home/ubuntu/sql/rd1.db", "stmt": "SELECT max(Time) FROM rd"}, function(d) {
	
		var date = d[0]["max(Time)"];
		
		// test different date
		if (date.substr(0,10) !== day) {
		    tekst("warning", "p", "No data available for " + day + ". Latest available trade timestamp: " + date);
        }

		// date selectors
		date = date.substr(0, 10);
		document.getElementById("date-from").value = date;
		document.getElementById("date-to").value = date;
		
		// ...
		updateDateButtons(someWeekDays((new Date(date)).getTime()));
	
		//clearAction();
		clearUX();
	});

    // ISIN codes
	sqliteSQL({"url": "/home/ubuntu/sql/rd1.db", "stmt": "SELECT DISTINCT ISIN, Name FROM rd ORDER BY Name"}, function(d) {

        var ar = [],
            markup = "";
        
        ar = _.map(d, function(d) {return "<option value='" + d.ISIN + "'>" + d.Name + "&nbsp;&nbsp;" + d.ISIN + "</option>"; });
        markup = "<option value='all'>All</option>" + ar.join("");
        
        document.getElementById("isin1").innerHTML = markup;
        document.getElementById("isin2").innerHTML = markup;
        
        // global var
        isin_all = _.object(_.map(d, function(d) {return [d.ISIN, d.Name]; }));
                
        // 
        checkStaticData();
        
        // add groups to static_codes
        xgroupBonds();
                        
        // 
        clearUX();
    });
}



// ToDo: possibly get all id's and clear screen
function clearScreen(list) {

    list = list || [ "warning", "diagram11", "diagram21", "diagram12", "diagram22", "diagram13", "diagram23", "histogram11", "histogram21", "histogram12", "histogram22", "table1", "table2"];

    list.forEach(function(d) {return document.getElementById(d).textContent = "";});
}


// d: data
function showTables(d) {

    var group = {}, 
        data = [], kees = [],
        
        diag = document.getElementById("diagram").value,
        isin1 = document.getElementById("isin1").value,
        isin2 = document.getElementById("isin2").value
        
        ;
      
    // ...	
    tableTransactions("table2", d);

	// --- group raw data by ISIN for tables ---

	convertDateTime(d, "Time");

	group = _.groupBy(d, "ISIN");
	kees = _.keys(group);
	    
	data = _.map(kees, function(d) {return _.extend(stats(_.pluck(group[d], "Price")), {isin: d}, {vwap: vwap(group[d], "Price", "Volume") }, {name: isin_all[d] }); });
	  
	tableStats("table1", data);
	  
	// --- generate diagrams ---
	  
	if (diag === "individual") {
		
	    if (isin1 === "all") {
	        isin1 = (kees.length > 0) ? kees[0] : null ;
	        
	        if (isin1 !== null) {document.getElementById("isin1").value = isin1; }
	    }

	    if (isin2 === "all") {
	        isin2 = (kees.length > 1) ? kees[1] : null ;

	        if (isin2 !== null) {document.getElementById("isin2").value = isin2; }
	    }
			
	    if ((! _.isEmpty(isin1)) && (! _.isEmpty(group[isin1]))) {
	    
			mgDiagram("diagram11", "line", group[isin1], isin1);

			mgDiagram("diagram12", "point", group[isin1], isin1);
	
			mgDiagram("diagram13", "point-size", group[isin1], isin1);

			mgHistogram("histogram11",  _.pluck(group[isin1], "Price"), isin1, "Price");

			mgHistogram("histogram12", _.pluck(group[isin1], "Volume"), isin1, "Volume");
		 }

		 if (isin1 !== isin2 && (! _.isEmpty(isin1)) && (! _.isEmpty(group[isin2]))) {
		 
			mgDiagram("diagram21", "line", group[isin2], isin2);

			mgDiagram("diagram22", "point", group[isin2], isin2);
	
			mgDiagram("diagram23", "point-size", group[isin2], isin2);

			mgHistogram("histogram21", _.pluck(group[isin2], "Price"), isin2, "Price");		

			mgHistogram("histogram22", _.pluck(group[isin2], "Volume"), isin2, "Volume");
		 }
    }	
}


/*
  . Warning: This is a preliminary function
  
  . [seller, buyer, counter] is added

*/
function addToRawData(d) {

    var i = 1;

	// --- Preliminary solution: extend with seller and buyer ---
	d.forEach(function(v) {
		  
		  // ToDo: now it is a random sample of counterparties
		  var list = ["BRF", "Skibs", "Danske", "DLR", "Føroya", "Kommune", "Fiskeri", "LR", "Nordea", "Nyk", "Total", "Uni"];
		   
		  v.seller = (Math.random() < 0.4) ? "RD" : _.sample(list) ;  
		  
		  v.buyer = (Math.random() < 0.4) ? "RD" : _.sample(list);
		  
		  if (v.seller === v.buyer) {v.buyer = _.sample(_.without(list.concat("RD"), v.seller)); }
	  
	      // counter
	      v.counter = i++;
	      
	      // return
	      return v;
	});
}


/*
 .

*/
function getISIN(m) {

    var isin1 = "", isin2 = "";
    
    if (m === "two") {
        isin1 = document.getElementById("isin1").value,
        isin2 = document.getElementById("isin2").value;
    
        return (isin1 === isin2) ? [isin1] : [isin1, isin2] ;
    }
}


//call R function: stats::sd(x=data)
function transactions() {

    setAction("Getting data!", false, 0.85);
  
    var stmt = "", 
        j = 0,
        dates = [],
        
        isin1 = document.getElementById("isin1").value,
        isin2 = document.getElementById("isin2").value;
  
    // ...
    dates = getToFrom();
  
    if (_.isEmpty(dates)) {
        // text is sent from getToFrom() function
        clearAction();
        return;
  
    } else {
  
        j = (dates.length === 1) ? 0 : 1 ;
    }
    
    // ...
    if (isin1 !== "all" || isin2 !== "all") {
        stmt = (isin1 === isin2) ? ("ISIN = '" + isin1 + "' AND ") : ("ISIN IN ('" + isin1 + "', '" + isin2 + "') AND ") ;
    
    }
  
    // Get new data
    stmt = "SELECT * FROM rd WHERE " + stmt + " Time BETWEEN '" + dates[0] + "' AND date('" + dates[j] + "', '+1 days') ORDER BY Time ASC, ISIN ASC";
  
    sqliteSQL({"url": "/home/ubuntu/sql/rd1.db", "stmt": stmt}, function(d) {
  
        var txt = "";
  
	    // ...
	    if (_.isEmpty(d)) {
            
            txt = (j === 0) ? ("No data available for: " + dates[0] + ".") : ("No data available from: " + dates[0] + " to: " + dates[j] + ".") ;

		    tekst("warning", "p", txt);
  
	    } else {
  
		    addToRawData(d);
		    
		    // Note: Possibly switch on this check: all volumes must be > 0
		    //d = _.filter(d, function(d) {return d.Volume > 0; });
		  
		    showTables(d);
	  
		    //console.log(d);
	    }
	  
	    // ...
	   clearAction();
    }); 

}


/*

 . showTrades(data_all, mean) 
 
 . Number formatting: see http://bl.ocks.org/zanarmstrong/05c1e95bf7aa16c4768e
 
*/
function showTrades() {

    var data = [], isins = [],
        i = 0, j = 0,
        div7 = document.getElementById("diag-7"),
        div8 = document.getElementById("diag-8");

	// ...		    
	data_all = _.chain(data_all)
		 .groupBy(function(d) {return d.ISIN + (d.Time).substr(0,10); })
		 .map(function(d) {var avg = vwap(d,"Price","Volume"), volm = math.sum(_.pluck(d,"Volume")); return {ISIN: d[0].ISIN, date: (d[0].Time).substr(0,10), mean: avg, volume: volm, stats: stats(math.subtract(_.pluck(d, "Price"), avg)), data: d };})
		 .sortBy(function(d) {return Math.max(d.stats.max, -d.stats.min);})
		 .reverse()
		 .map(function(d) {d.row = i++; return d;})
		 .value();
	
	// ...
	//makeTable("table-3", ([["Date", "Name", "ISIN", "Count", "Mean", "Diff", "Min", "Max", "Range", "Volume"]]).concat(_.map(data_all, function(d) {return [d.date, d.data[0].Name, d.ISIN, d.stats.length, d.mean.toFixed(2), ((Math.abs(d.stats.max) > Math.abs(d.stats.min)) ? d.stats.max : d.stats.min ).toFixed(2), d.stats.min.toFixed(2), d.stats.max.toFixed(2), d.stats.range.toFixed(2), d.volume.toLocaleString() ]; })));


    // ...
    MG.data_table({
			title: "Table",
			description: "Table",
			data: data_all
		})
        .target("#table-3")
		.text({accessor: "date", label: "Date"})
		.number({accessor: "ISIN", label: "Name", value_formatter: function(d) {return isin_all[d]; }, color: d3.scale.category20() })
		.text({accessor: "ISIN", label: "ISIN", color: d3.scale.category20() })
		.number({accessor: "stats", label: "Count", value_formatter: function(d) {return d.length; }})
		.number({accessor: "mean", label: "Mean", round: 2})
		.number({accessor: "stats", label: "Diff", value_formatter: function(d) {return (Math.abs(d.max) > Math.abs(d.min)) ? (d.max).toFixed(2) : (d.min).toFixed(2) ; }, color: "blue"})
		.number({accessor: "stats", label: "Min", value_formatter: function(d) {return (d.min).toFixed(2); }})
		.number({accessor: "stats", label: "Max", value_formatter: function(d) {return (d.max).toFixed(2); }})
		.number({accessor: "stats", label: "Range", value_formatter: function(d) {return (d.range).toFixed(2); }})
		.number({accessor: "volume", label: "Volume", value_formatter: d3.format(",.0f") })
		.display();  



    // ...
/*
    data = _.chain(data_all)
            .map(function(d) {_.each(d.data, function(f) {f.mean = d.mean; return f; }); return d.data; })
            .flatten()
            .map(function(d) {return [d.Time, (d.Price - d.mean).toFixed(2), d.Price, d.mean.toFixed(2), d.Name, d.ISIN, d.buyer, d.seller, d.Volume]; })
            .sortBy(function(d) {return Math.abs(d[1]); })
            .reverse()
            .value();

    makeTable("table-6", ([["Time", "Diff", "Price", "Mean", "Name", "ISIN", "Buyer", "Seller", "Volume"]]).concat(data));
*/

    j = 1;
    data = _.chain(data_all)
            .map(function(d) {_.each(d.data, function(f) {f.mean = d.mean; f.diff = f.Price - d.mean; return f; }); return d.data; })
            .flatten()
            .sortBy(function(d) {return Math.abs(d.diff); })
            .reverse()
            .each(function(d) {return d.counter = j++; })
            .value();

    MG.data_table({
			title: "Table",
			description: "Table",
			data: data
		})
        .target("#table-6")
		.number({accessor: "counter", label: "Row"})
		.text({accessor: "Time", label: "Time"})
		.number({accessor: "diff", label: "Diff", color: "blue", value_formatter: function(d) {return d.toFixed(2); } })
		.number({accessor: "Price", label: "Price"})
		.number({accessor: "mean", label: "Mean", value_formatter: function(d) {return d.toFixed(2); } })
		.text({accessor: "Name", label: "Name", color: d3.scale.category20() })
		.text({accessor: "ISIN", label: "ISIN", color: d3.scale.category20() })
		.text({accessor: "buyer", label: "Buyer", color: function(d) {return d === "RD" ? "red" : "auto"; }})
		.text({accessor: "seller", label: "Seller", color: function(d) {return d === "RD" ? "red" : "auto"; }})
		.number({accessor: "Volume", label: "Volume", value_formatter: d3.format(",.0f") })
		.display();  
    
    
    // Make change to time format here because in the tables we want another format of time, else just add another element to the objects
    data_all.forEach(function(d) {
        
        convertDateTime(d.data, "Time"); 
    });
    
    // for each ISIN ...
    isins = _.pluck(data_all, "ISIN");
    
    j = 0;
    isins.forEach(function(d) {
    
        var data1 = [], data2 = [],
            el,
            mean = 0;
                   
        // ...
        data1 = getBondGroupData(d);

        // Only ISIN code
        data2 = _.findWhere(data1, {ISIN: d});
        mean = data2.mean;
        data2 = data2.data;
        
        // Also Peer Bonds
        data1 = _.flatten(_.pluck(data1,"data"));

        // Line
        j++;
        el = document.createElement("div");
        el.setAttribute("id", "diag-7" + j);
        div7.appendChild(el);

        mgDiagram("diag-7" + j, "line", data2, d, [{label: "mean", value: mean }]);

        
        // Point with peer Bonds
        j++;
        el = document.createElement("div");
        el.setAttribute("id", "diag-7" + j);
        div7.appendChild(el);
                
        // making a copy of data so that data does not change while drawing
        mgDiagram("diag-7" + j, "point-group", data1, d, [{label: "mean", value: mean }]);


        // Point with Volume diameters
        j++;
        el = document.createElement("div");
        el.setAttribute("id", "diag-7" + j);
        div7.appendChild(el);
                        
        // making a copy of data so that data does not change while drawing
        mgDiagram("diag-7" + j, "point-size", data2, d, [{label: "mean", value: mean }]);

        // Separator: <HR>
        el = document.createElement("hr");
        el.setAttribute("style", "background-color:rgb(200,0,0);height:5px;");
        div7.appendChild(el);
        div7.appendChild(document.createElement("br"));
        div7.appendChild(document.createElement("br"));

        // Histogram
        j++;
        el = document.createElement("div");
        el.setAttribute("id", "diag-8" + j);
        div8.appendChild(el);
        
        // ...
        mgHistogram("diag-8" + j, _.pluck(data2, "Price"), d, "Price");	
        
    });	
}


/*

 . call R function: stats::sd(x=data)

*/ 
function go() {

    setAction("Getting data!", false, 0.85);
  
    var stmt = "", 
        j = 0,
        dates = [];
  
    // ...
    dates = getToFrom();
  
    if (_.isEmpty(dates)) {
        // text is sent from getToFrom() function
        clearAction();
        return;
  
    } else {
  
        j = (dates.length === 1) ? 0 : 1 ;
    }
      
    // Get new data
    stmt = "SELECT * FROM rd WHERE " + stmt + " Time BETWEEN '" + dates[0] + "' AND date('" + dates[j] + "', '+1 days') ORDER BY Time ASC, ISIN ASC";
  
    sqliteSQL({"url": "/home/ubuntu/sql/rd1.db", "stmt": stmt}, function(f) {
  
        var txt = "", 
            i = 1;
  
	    // ...
	    if (_.isEmpty(f)) {
            
            txt = (j === 0) ? ("No data available for: " + dates[0] + ".") : ("No data available from: " + dates[0] + " to: " + dates[j] + ".") ;

		    tekst("warning", "p", txt);
  
	    } else {
  
		    // ...
		    addToRawData(f);
		    
		    data_all = f;
		    
		    // Possibly keep data and only call if new selections
		    showTrades();
	  
		    // console.log(data_all);
	    }
	  
	    // ...
	   clearAction();
    }); 

}


// --- init ---
uxInit();

  