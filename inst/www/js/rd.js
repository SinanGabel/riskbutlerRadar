"use strict";


// --- r-code.js ---

/*
  . warning: https is necessary here

  . warning: on local machine e.g. Mac set in .htaccess file => Header set Access-Control-Allow-Origin "*"

*/
ocpu.seturl("https://riskbutler.net/ocpu/github/sinangabel/radar/R");

// --- global vars ---




/*

 . Test ok: sqliteSQL({"url": "/home/ubuntu/sql/ecb.db", "stmt": 'SELECT * FROM stdin where "code" = "USD"'}, function(d) {return console.log(d); })          
            
 . with ecb.db use e.g.:  _.map(output, function(v,k) {return {"value": v.CLOSE, "date": new Date(v.DATE) }; }) 
 
 . sqliteSQL({"url": "/home/ubuntu/sql/fxf.db", "stmt": "SELECT DISTINCT CODE FROM stdin LIMIT 1000" }, function(d) {return console.log(d); })

 . curl 'https://riskbutler.net/ocpu/github/sinangabel/radar/R/sqlite.sql/json' -H "Content-Type: application/json" -d '{"url": "/home/ubuntu/sql/fxf.db", "stmt": "SELECT DISTINCT CODE FROM stdin LIMIT 1000" }'

 . data = _.map(data, function(d) {var dt = (d.DATE).toString(); return {"value": d.CLOSE, "date": new Date(Date.UTC(dt.substr(0,4), dt.substr(4,2), dt.substr(2,2), d.TIME.substr(0,2), d.TIME.substr(2,2), d.TIME.substr(4,2))) }; });
          
 . stmt: e.g. 'select * from stdin where CODE="USD" and DATE between "2013-01-01" and "2016-04-01" order by DATE ASC'

*/
function sqliteSQL(params, callback) {

    // filter required parameters
    var required_keys = ["url", "stmt"];  
  
    params = _.pick(params, required_keys);
  
    if (! _.isEqual(_.union(_.keys(params), required_keys), required_keys)) {
        console.log("missing parameters");
        return;
    }
    
    // callback check 
    if (_.isFunction(callback) === false) {
        console.log("callback not a function");
        return;
    } 
    
    // continue
    var req = ocpu.rpc("sqlite.sql", params, function(res) {
  
        callback(res);
    });
  
    req.fail(function() {
        console.log("R returned an error: ", req.responseText);
    });

    req.always(function() {
		console.log("R called!");  
	});
}


// --- filter.js ---

/*
  . id: DOM id
  . m: matrix
  . ToDo: possibility to format numbers
  .    . add thead
       . add class as parameter
*/
function makeTable(id, m, cls) {

    cls = cls || "pure-table pure-table-striped";

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
		   td.textContent = trs[j];
		   tr.appendChild(td);
		}
		tb.appendChild(tr);
	}
	table.appendChild(tb);
	
	// if l>2500 td: padding 6px
	if (l < 2500) {table.setAttribute("class", cls); }
	document.getElementById(id).appendChild(table);
}

/*
  . t: html DOM table
  
  . note: it is assumed that firstChild of t is <tbody> as in makeTable()
  
  . example: "pf-display" => t = document.getElementById("pf-display").firstChild
*/
function tableToArray(t) {
  
  function fun(r) {
      return _.map(r.children, function(d) {return d.textContent; });
  }
  
  return _.map(t.firstChild.childNodes, function(d) {return fun(d); });
}


/*
 . ar: matrix
 
 . example: arrayToCsv(tableToArray(document.getElementById("pf-display").firstChild)) => .csv text
*/
function arrayToCsv(ar) {
    return _.reduce(_.map(ar, function(d) {return d.join();}), function(a, b) {return a + "\n" + b; }, "");
}


/*
 . warning for multiseries(): the first label should be "t" and the first time series of matrix should be time in milliseconds
 . Warning: time1, time2 etc. must be identical => see tip below

 . obj as matrix: [[label1, label2, ...], [times1, times2, ...], [timeseries1, timeseries2]]
 . matrixToJson([["t","a","b"], [1384905600000, 1384992000000, 1385078400000],[3,4,5],[30,40,50] ])
 
 . obj as timeseriesA: {"label1": [[time1, time2, ...], [timeseries1]], ...}
 
 . return format: 
      [{
		"t": 1409320800000,
		"pct05": 5350,
		"pct25": 6756,
		"pct50": 7819,
		"pct75": 9284,
		"pct95": 13835
	   }, ...]
 
 . Tip: 
   .  matrixToJson(filterData(1, timeseriesA,"day",1426809600000)); from = new Date("2015-03-20Z").getTime() = 1426809600000
   
   .  historical market prices: 
        _.map(calc_tmp["i"], function(d) {return matrixToJson([["t", d.symbol], d.hist_times, d.hist]); })
        _.map(calc_tmp["i"], function(d) {return matrixToJson([["t", d.symbol], _.map(d.hist_times, function(f) {return new Date(f);}), d.hist]); })
  
 . ToDo: possibly exclude some data points	   

*/
function matrixToJson(obj) {

    if (_.isEmpty(obj)) {return; }  // no data
    
    var lb = [], t = [], v = [];
    
    // assumed matrix i.e. array of arrays
    if (_.isArray(obj)) {
    
        lb = obj[0];  // keys (labels)    
        return _.map(numeric.transpose(_.rest(obj)), function(d) {return _.object(lb, d); })
    
    // assumed object = timeseriesA, possibly after filterData()
    } else {
    
        // keys (labels)
        lb = _.keys(obj);
        
        // time
        t = obj[lb[0]][0];  // array of time
        
        // check for time format day or ms since 1970
        if ((t[0]).toString().length < 13) {t = numeric.mul(t, 86400000); }
        
        // continue
        lb = ["t"].concat(lb);   
        
        // values
        v = _.map(obj, function(v) {return v[1]; });  // values (without time)
        v = [t].concat(v);
        
        return _.map(numeric.transpose(v), function(d) {return _.object(lb, d); })
    }
}


/**

 . Used to import FX data a.o. from own couchdb databases

 . json: format: 
      [{
		"t": 1409320800000,
		"pct05": 5350,
		"pct25": 6756,
		"pct50": 7819,
		"pct75": 9284,
		"pct95": 13835
	   }, ...]
	     
  . return format: 
        {key: [time, values], key: [time, values]}
      
  . Warning: json[0] may not contain all keys, it could be one of the other objects
*/
function jsonToMatrix(json) {

    if (_.isEmpty(json)) {return; }
    
    json = _.sortBy(json, "t");

    var k = _.without(_.keys(json[0]),"t"),
        i = 0,
        obj = {},
        
        t = _.map(json, function(d) {return d.t; });
            
    for (i = 0; i < k.length; i++) {
    
        obj[k[i]] = numeric.transpose(_.map(json, function(d) {return [d.t, d[k[i]]]; }));    
    }
    
    return obj;
}


/*

 . json: format: 
      [{
		"t": 1409320800000,
		"pct05": 5350,
		"pct25": 6756,
		"pct50": 7819,
		"pct75": 9284,
		"pct95": 13835
	   }, ...]
	   
	   
  . return format: 
      [{key: pct05, values: [{},{} ...]}, {key: pct25, values: [{},{} ...]}, ...]
      
      
  . Used for small multiples diagram, for example    	   


*/
function d3FormatJsonFilter(json) {

    if (_.isEmpty(json)) {return; }

    var k = _.without(_.keys(json[0]),"t"),
        i = 0,
        ar = [],
        
        t_min = d3.min(json, function(d) {return d.t; }),
        t_max = d3.max(json, function(d) {return d.t; });
            
    for (i = 0; i < k.length; i++) {
    
        ar.push({"key": k[i], "t_min": t_min, "t_max": t_max, "v": _.map(json, function(d) {return {"ki": k[i], "p": d[k[i]], "t": d.t }}) });    
    }
    
    return ar;
}


// --- ui.js ---

/*
 . tekst("big-diagram", "p", "this is some text ...")
 
 . id: "big-diagram"
 . e : "p" for <p> element
 . t : "Some text for the element <p></p>"
*/
function tekst(id, e, t) {
    var d = document.getElementById(id);
    d.appendChild(document.createElement(e));
    d.lastChild.textContent = t;
}

// --- other ---

function mgDiagram(id, type, data, isin) {

  MG.data_graphic({
  title: "Diagram: " + isin,
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
  });

}

// ...
function tableStats(id, data) {

    MG.data_table({
        title: "Statistics",
        description: "Table of numbers",
        data: data
        //show_tooltips: true
    })
    .target("#" +  id)
    .title({ accessor: "title", label: "ISIN"})
    .number({ accessor: "length", label: "Total", color: "gray"})
    .number({ accessor: "min", label: "Min", round: 2})
    .number({ accessor: "mean", label: "Mean", color: "blue", round: 2})
    .number({ accessor: "max", label: "Max", color: "gray", round: 2})
    .number({ accessor: "range", label: "Range", round: 2})
    .number({ accessor: "vol", label: "Volatility", round: 2})
    .display();

}

// ...
function stats(ar) {

    var min = math.min(ar),
        max = math.max(ar);

    return {length: ar.length, mean: math.mean(ar), min: min, max: max, range: max - min, vol: math.std(ar) };

}


// initialise
// 'SELECT * FROM rd where Time BETWEEN "2016-02-15" AND "2016-03-15";'
function initialise() {

    var markup = "";

    sqliteSQL({"url": "/home/ubuntu/sql/rd1.db", "stmt": 'SELECT distinct ISIN FROM rd order by ISIN ASC'}, function(d) {
    
        var ar = _.map(_.pluck(d, "ISIN"), function(d) {return "<option>" + d + "</option>"; });
        document.getElementById("isin1").innerHTML = ar.join();
        document.getElementById("isin2").innerHTML = ar.join();
    
    });


}
initialise();


// ...
function clearScreen() {

    document.getElementById("diagram1").textContent = "";
    document.getElementById("diagram2").textContent = "";
    document.getElementById("table1").textContent = "";
    document.getElementById("table2").textContent = "";

}



//call R function: stats::sd(x=data)
function visualise() {
  
  var isin1 = document.getElementById("isin1").value,
      isin2 = document.getElementById("isin2").value,
      from = document.getElementById("date-from").value,
      to = document.getElementById("date-to").value, 
      stmt = "",
      d1 = 0, d2 = 0;
      
  // ...
  if (from === "" && to === "") {
      stmt = "SELECT * FROM rd WHERE ISIN IN ('" + isin1 + "', '" + isin2 + "') order by Time ASC, ISIN ASC";
  

//  } else if (from === to) {
//      stmt = "SELECT * FROM rd WHERE ISIN IN ('" + isin1 + "', '" + isin2 + "') AND Time between '" + from + "' AND date('" + to + "', '+1 days') order by Time ASC, ISIN ASC";
//
//  } else if (from !== "" || to !== "") {
  } else {
  
  
      from = (from === "") ? "1970-01-01" : from;
      to = (to === "") ? "2050-01-01" : to;
      
      // check figures
      d1 = (new Date(from)).getTime();
      d2 = (new Date(to)).getTime();
      if (d1 > d2) {
          clearScreen();
          document.getElementById("diagram1").textContent = "Date selection error: Please select a From date that is before the To date!";
          return;
      }
  
      // continue
      stmt = "SELECT * FROM rd WHERE ISIN IN ('" + isin1 + "', '" + isin2 + "') AND Time between '" + from + "' AND date('" + to + "', '+1 days') order by Time ASC, ISIN ASC";
  }    

  sqliteSQL({"url": "/home/ubuntu/sql/rd1.db", "stmt": stmt}, function(d) {
  
  
  // --- extend with seller and buyer ---
  var i = 0, data = []; 

  d.forEach(function(v) {
      i++; 
      v.seller = (i % 2 === 0) ? "RD" : "NYK"; 
      v.buyer = (v.seller === "RD") ? "NYK" : "RD";
      return v; });
  
  console.log(d);
  

  // --- generate tables ---
  data = _.groupBy(d, "ISIN");
  data = [_.extend(stats(_.pluck(data[isin1], "Price")), {title: isin1}), _.extend(stats(_.pluck(data[isin2], "Price")), {title: isin2})]; 

  tableStats("table1", data);
    

    MG.data_table({
        title: "A table",
        description: "A table",
        data: d
        //show_tooltips: true
    })
    .target("#table2")
    .title({accessor: "ISIN", label: "ISIN", color: "gray"})
    .number({ accessor: 'Price', label: 'Price', color: "blue"})
    .number({ accessor: 'Time', label: 'Time'})
    .text({ accessor: 'Name', label: 'Name'})
    .number({ accessor: 'Volume', label: 'Volume'})
    .text({ accessor: 'buyer', label: 'Buyer', color: function(d) {return d === "RD" ? "blue" : "auto"; }})
    .text({ accessor: 'seller', label: 'Seller', color: function(d) {return d === "RD" ? "blue" : "auto"; }})
    .display();  
    
    
    // --- generate diagrams ---
    
    d.forEach(function(v) {
          v.Time = new Date(v.Time);
          return v; 
    });
    
    data = _.groupBy(d, "ISIN");
    
    var diag = document.getElementById("diagram").value;
    
    mgDiagram("diagram1", diag, data[isin1], isin1);
    mgDiagram("diagram2", diag, data[isin2], isin2);



    });    
};


  