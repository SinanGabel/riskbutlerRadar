"use strict";



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

function mgDiagram(id, type, data, isin) {

    if (data.length < 3) {return;}

 var json = {
  title: "Price: " + isin,
  description: "Price development",
  data: data,
  chart_type: type,
  width: 480,
  height: 300,
  //color: '#8C001A',
  min_y_from_data: true,
  decimals: 5,
  //baselines: [{value: s[0].mean, label: 'mean'}],
  target: document.getElementById(id),
  x_accessor: "Time",
  y_accessor: ["Price"]
  //linked: true
  };
  
  // ...
  if (type === "point" && data.length > 20 ) {

      json.least_squares = true;
  }

  if (type === "point-size") {
  
      json.title = "Price (point) & Volume (size): " + isin;
      json.chart_type = "point";
      json.description = "Price & Volume development";
      json.color_accessor = "Volume";
      json.size_accessor = "Volume";
      json.size_range = [1,40];      
  }
  
  // ...
  MG.data_graphic(json);  

}

// ...
function mgHistogram(id, data, isin, accessor) {

    data = _.pluck(data[isin], accessor);

    if (data.length < 5) {return;}

	MG.data_graphic({
		title: accessor + ": " + isin,
		description: accessor + " histogram",
		data: data,
		chart_type: "histogram",
		width: 480,
		height: 300,
		//right: 10,
		bins: 50,
		bar_margin: 0,
		target: "#" + id,
		y_extended_ticks: true,
		mouseover: function(d, i) {
			d3.select("#" + id + " svg .mg-active-datapoint")
			  .text(accessor + ": " + d3.round(d.x,2) +  "   Count: " + d.y);
		}
	});
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
		    document.getElementById("warning").textContent = "No data available for " + day + ". Latest available trade timestamp: " + date;
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
        
        clearUX();
    });
}



// ToDo: possibly get all id's and clear screen
function clearScreen() {

    var list = [ "warning", "diagram11", "diagram21", "diagram12", "diagram22", "diagram13", "diagram23", "histogram11", "histogram21", "histogram12", "histogram22", "table1", "table2"];

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

			mgHistogram("histogram11", group, isin1, "Price");

			mgHistogram("histogram12", group, isin1, "Volume");
		 }

		 if (isin1 !== isin2 && (! _.isEmpty(isin1)) && (! _.isEmpty(group[isin2]))) {
		 
			mgDiagram("diagram21", "line", group[isin2], isin2);

			mgDiagram("diagram22", "point", group[isin2], isin2);
	
			mgDiagram("diagram23", "point-size", group[isin2], isin2);

			mgHistogram("histogram21", group, isin2, "Price");		

			mgHistogram("histogram22", group, isin2, "Volume");
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
		  var other = _.sample(["BRF", "Skibs", "Danske", "DLR", "Føroya", "Kommune", "Fiskeri", "LR", "Nordea", "Nyk", "Total", "Uni"]);
		   
		  v.seller = (Math.random() < 0.5) ? "RD" : other;  // RD 30 % of the samples
		  v.buyer = (v.seller === "RD") ? other : "RD";
	  
	      // counter
	      v.counter = i++;
	      
	      // return
	      return v;
	});
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
	  
		    console.log(d);
	    }
	  
	    // ...
	   clearAction();
    }); 

}


// --- init ---
uxInit();

  