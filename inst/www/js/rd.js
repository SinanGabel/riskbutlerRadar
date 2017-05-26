"use strict";


/*
 . This algorithm (k=33) was first reported by dan bernstein many years ago in comp.lang.c. another version of this algorithm (now favored by bernstein) uses xor: hash(i) = hash(i - 1) * 33 ^ str[i]; the magic of number 33 (why it works better than many other constants, prime or not) has never been adequately explained.

 . Refer to: http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-

*/
function djb2HashCode(str) {

    var hash = 5381, i = 0, l = str.length, c = "";
    
    for (i = 0; i < l; i++) {
        
        c = str.charCodeAt(i);
        hash = ((hash << 5) + hash) + c;  // hash * 33 + c 
    }
    return hash;
}

/*
 . returns an array of indexes of arr where search string txt matches the first part of every character string within txt
 
 . Note: this is a general function
*/
function searchTxt(arr, txt) {
    
    var txt_ar = [], pat = [], ar = [], f = [],
        l_p = 0, l = 0, i = 0;
        
    // ...
    l = arr.length;  
      
	if (txt.length > 0 && txt.trim() !== "") {
  
		  // ("   novo    nordisk  aa bbb ").replace(/\s+/g, " ").trim().split(" ")  -> ["novo", "nordisk", "aa", "bbb"]
		  txt_ar = (txt).replace(/\s+/g, " ").trim().split(" ");

		  pat = _.map(txt_ar, function(d) {return new RegExp("\\b" + d, "i"); });

		  l_p = pat.length;
		
		  for (i = 0; i < l; i++) {
	  
			  // new
			  f = _.filter(pat, function(d) {return d.test(arr[i]) === true});
					  
			  // check that all sub strings return true in f
			  if (f.length === l_p) {ar.push(i); }
		  }
	  
	} else {
	  
		  // show all or a subset of all available codes
		  ar = _.range(0, l);
	}
	  
	return ar;
}


/*

. ...

*/
function searchSymbol(txt) {

    txt = txt || document.getElementById("input-symbol-search").value;
    
    var ar = [];
    
    static_codes_str_sub = _.map(static_codes, function(d) {return (_.values(_.pick(d, ["isin", "name", "issuer", "issuer_short", "coupon", "expiry", "base", "bond_type", "loan_type", "repayment_spec", "repayment_profile"]))).join(" - "); });
    
    ar = searchTxt(static_codes_str_sub, txt);
	  
	document.getElementById("display-symbol-search").innerHTML = 
	
	"<p>Click to select Bond(s)</p><br>" +
	
	_.map(ar, function(d) {
	    
	    var t = static_codes_str_sub[d],
            i = t.substr(0,12).toUpperCase(),
            markup = (list_selected_symbols.indexOf(i) === -1) ? "pure-button" : "pure-button button-three"; 
	    
	    return '<button class=\'' + markup + '\' id=\'' + i + '\' onclick="selectSymbol(\'' +  t + '\')">' + t + '</button><br>'; 
	
	}).join(" ");
}


/*


/*
 . ...
*/
function selectSymbol(i) {

    var div, el,
        isin = "";
    
    //
    isin = i.substr(0,12).toUpperCase();

    if (list_selected_symbols.indexOf(isin) !== -1) {return; }

    //
    list_selected_symbols.push(isin);
    
    //
    document.getElementById(isin).className = "pure-button button-three";
    
    //
    div = document.getElementById("symbols-selected");
    
    el = document.createElement("button");
    el.textContent = "Remove: " + i;
    el.setAttribute("class", "pure-button");
    el.setAttribute('onclick', 'this.parentNode.removeChild(this);list_selected_symbols=_.without(list_selected_symbols,\'' + isin + '\');if(document.getElementById("display-symbol-search").textContent!==""){document.getElementById(\'' + isin + '\').className = "pure-button";}');
    
    div.appendChild(el);    
}


/*
 . ...
*/
function buildSymbolList(d) {

        var ar = [],
            markup = "";
        
        ar = _.map(d, function(d) {return "<option value='" + d.isin + "'>" + d.name + "&nbsp;&nbsp;" + d.isin + "</option>"; });
        markup = "<option value='all'>All</option>" + ar.join("");
        
        document.getElementById("isin1").innerHTML = markup;
        document.getElementById("isin2").innerHTML = markup;


}


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
 
 . (1) RD & isin
 . (2) ! RD & isin
 . (3) RD & ! isin
 . (4) ! RD & ! isin
*/ 
function addColorAccessor(data, isin, issuer) {

    issuer = issuer || "RD";

    data.forEach(function(d) {
    
        if (d.isin === isin) {  
        
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
    
    var stic = {}, json = {};
    
    //
    stic = _.findWhere(static_codes, {"isin": isin});
   
    json = {
		  title: stic.name2 + " Price",
		  description: stic.name + " " + isin + " price development",
  
		  data: data,
		  chart_type: type,
		  width: r_width,
		  height: r_height,
  
		  target: document.getElementById(id),
		  x_accessor: "time",
		  y_accessor: ["price"],
		  
          baselines: baseln,

          x_mouseover: function(d) {return d.time + "  "; },
          y_mouseover: function(d) {return ((d.isin === isin) ? "" : (" " + d.name + " " + d.isin)) + " P:" + d.price + " B: " + d.buyer + " S: " + d.seller + " Diff: " + (d.diff).toFixed(2); },
		  
		  show_secondary_x_label: true,
		  min_y_from_data: true,
		  decimals: 5,
  
		  yax_format: d3.format('.4s'),
		  y_rug: true,
		  linked: true };
		  
	// multiple days
    if (_.union(_.pluck(data_all,"date")).length > 1) {
        json.baselines = null;
    }
    
    if (_.isEmpty(json.baselines)) {json.least_squares = true; }

	  
  
    // ...
    if (type === "line") {
    
        json.area = false;
        json.interpolate = "linear";
    
//    } else if (type === "point" && data.length > 20 ) {
//
//        json.least_squares = true;
    
    } else if (type === "point-size") {
  
      json.title = stic.name2 + " Price & Volume";
      json.description = stic.name + " " + isin + " price & volume development";


      json.size_accessor = "volume";
      json.size_range = [1,40];      

      json.y_mouseover = function(d) {return ((d.isin === isin) ? "" : (" " + d.name + " " + d.isin)) + " P:" + d.price + " B: " + d.buyer + " S: " + d.seller + " V: " + (d.volume).toLocaleString() ; };

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
		width: 480,
		height: 300,

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
    
    return _.filter(data_all, function(v) {return isins.indexOf(v.isin) !== -1; });
}


/*
 . vwap(d, "price", "volume")

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
	sqliteSQL({"url": "/home/" + user + "/sql/rd1.db", "stmt": "SELECT max(Time) FROM rd"}, function(d) {
	
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
	sqliteSQL({"url": "/home/" + user + "/sql/rd1.db", "stmt": "SELECT DISTINCT ISIN, Name FROM rd ORDER BY Name"}, function(d) {
        
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


/*
  . Warning: This is a preliminary function
  
  . [seller, buyer, counter] is added

*/
function addToRawData(ar) {
    
    if (_.isEmpty(ar)) {return ar; }
    
    var list = [], okeys = [], nkeys = [],
        n = 0, m = 0,
        obj = {};


    list = ["BRF", "Skibs", "Danske", "DLR", "Føroya", "Kommune", "Fiskeri", "LR", "Nordea", "Nyk", "Total", "Uni"];
    
    okeys = _.keys(ar[0]);
    nkeys = _.map(okeys, function(d) {return d.toLowerCase(); });
    
    n = okeys.length;

	// --- Preliminary solution: extend with seller and buyer ---
	ar = _.map(ar, function(d) {
	
	    // convert all keys to lowercase letters
	    obj = {}
        m = n;
        
        while (m--) {
            obj[nkeys[m]] = d[okeys[m]];
        }
		
		// add buyer, seller  		   
		obj.seller = (Math.random() < 0.4) ? "RD" : _.sample(list) ;  
		  
		obj.buyer = (Math.random() < 0.4) ? "RD" : _.sample(list);
		  
		if (obj.seller === obj.buyer) {obj.buyer = _.sample(_.without(list.concat("RD"), obj.seller)); }
		
		// time
		obj.tid = obj.time;
		obj.time = new Date((obj.time).replace(/-/g, "/"));
	  
	    // return
	    return obj;
	});
	
	//
	ar = _.groupBy(ar, function(d) {return d.isin + (d.tid).substr(0,10); });
	
	//
	return _.map(ar, function(d) {
	    
	    var avg = vwap(d,"price","volume"), volm = math.sum(_.pluck(d,"volume")); 
	    
	    return {isin: d[0].isin, date: (d[0].tid).substr(0,10), mean: avg, volume: volm, stats: stats(math.subtract(_.pluck(d, "price"), avg)), data: _.each(d, function(f) {f.mean = avg; f.diff = f.price - avg; return f; }) }
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


/*
 . tableStatistics("table-2", data_all)
 
 . note: uses global var isin_all
*/
function tableStatistics(id, data) {

    document.getElementById(id).textContent = "";

    // ...
    MG.data_table({
			title: "Table",
			description: "Table",
			data: data
		})
        .target("#" + id)
		.text({accessor: "date", label: "Date"})
		.number({accessor: "isin", label: "Name", value_formatter: function(d) {return isin_all[d]; }, color: d3.scale.category20() })
		.text({accessor: "isin", label: "ISIN", color: d3.scale.category20() })
		.number({accessor: "stats", label: "Count", value_formatter: function(d) {return d.length; }})
		.number({accessor: "mean", label: "Mean", round: 2})
		.number({accessor: "stats", label: "Diff", value_formatter: function(d) {return (Math.abs(d.max) > Math.abs(d.min)) ? (d.max).toFixed(2) : (d.min).toFixed(2) ; }, color: "blue"})
		.number({accessor: "stats", label: "Min", value_formatter: function(d) {return (d.min).toFixed(2); }})
		.number({accessor: "stats", label: "Max", value_formatter: function(d) {return (d.max).toFixed(2); }})
		.number({accessor: "stats", label: "Range", value_formatter: function(d) {return (d.range).toFixed(2); }})
		.number({accessor: "volume", label: "Volume", value_formatter: d3.format(",.0f") })
		.display();  
}


/*
 .tableTrades("table-3", data_all)
*/
function tableTrades(id, data) {

    document.getElementById(id).textContent = "";

    // ...
    MG.data_table({
			title: "Table",
			description: "Table",
			data: data
		})
        .target("#" + id)
		.number({accessor: "counter", label: "Row"})
		.text({accessor: "tid", label: "Time"})
		.number({accessor: "diff", label: "Diff", color: "blue", value_formatter: function(d) {return d.toFixed(2); } })
		.number({accessor: "price", label: "Price"})
		.number({accessor: "mean", label: "Mean", value_formatter: function(d) {return d.toFixed(2); } })
		.text({accessor: "name", label: "Name", color: d3.scale.category20() })
		.text({accessor: "isin", label: "ISIN", color: d3.scale.category20() })
		.text({accessor: "buyer", label: "Buyer", color: function(d) {return d === "RD" ? "red" : "auto"; }})
		.text({accessor: "seller", label: "Seller", color: function(d) {return d === "RD" ? "red" : "auto"; }})
		.number({accessor: "volume", label: "Volume", value_formatter: d3.format(",.0f") })
		.display();  
}


/*
  . sortTable("table-2", data_all, true)
*/
// 
function sortTable(id, data, flatten) {

    var it = [],
        i = 1,
        str = "",
        fun;
    
    // => "d.date + d.name + d.diff"
    str = "d." + getItems(id).join(" + d.");
        
    //
   if (flatten !== undefined && flatten === true) {
   
       str = str.replace(/d.diff/, "((d.diff !== 0) ? Math.abs(d.diff).toFixed(4) : -1 )");
       
       return _.chain(data)
               .map(function(d) {return d.data; })
               .flatten()
               .sortBy(function(d) {return eval(str); })
               .reverse()
               .each(function(d) {d.counter = i++; return d; })
               .value();
   
   } else {
   
       str = str.replace(/d.diff/, "((d.stats.range !== 0) ? Math.max(d.stats.max,-d.stats.min).toFixed(4) : -1 )");
   
       return _.chain(data)
               .sortBy(function(d) {return eval(str); })
               .reverse()
               .each(function(d) {d.counter = i++; return d; })
               .value();
   } 
}


/*
 . getItems("sort-2") => ["date", "name", "diff"]

*/
function getItems(id) {

    var el = document.getElementById(id).children,
        l = el.length;
    
    return _.map(_.range(0, l), function(d) {return el.item(d).getAttribute("data-item"); });
}


/*

 . showTrades(data_all, mean) 
 
 . Number formatting: see http://bl.ocks.org/zanarmstrong/05c1e95bf7aa16c4768e
 
*/
function showTrades() {

    var data = [], isins = [],
        i = 0, j = 0, k = 0,
        div7 = document.getElementById("diag-4"),
        div8 = document.getElementById("diag-8");
        
    // multiple days
    k = _.union(_.pluck(data_all, "date")).length;
    
	// ...
    tableStatistics("table-2", sortTable("sort-2", data_all));

    // ...
    tableTrades("table-3", sortTable("sort-3", data_all, true));
        
    // for each isin ...
    isins = _.pluck(data_all, "isin");
    isins = _.union(isins);
    
    j = 0;
    isins.forEach(function(d) {
    
        var data1 = [], data2 = [],
            el,
            mean = 0;
                   
        // ...
        data1 = getBondGroupData(d);

        // Single isin code
        data2 = _.filter(data1, function(e) {return e.isin === d; });
        data2 = _.flatten(_.pluck(data2,"data"));
        
        // not used for k > 1
        mean = (k === 1) ? (data2[0]).mean : 0;
                
        // Also Peer Bonds
        data1 = _.flatten(_.pluck(data1,"data"));

        // Line
        j++;
        el = document.createElement("div");
        el.setAttribute("id", "diag-4" + j);
        div7.appendChild(el);

        mgDiagram("diag-4" + j, "line", data2, d, [{label: "mean", value: mean }]);

        
        // Point with peer Bonds
        j++;
        el = document.createElement("div");
        el.setAttribute("id", "diag-4" + j);
        div7.appendChild(el);
                
        // making a copy of data so that data does not change while drawing
        mgDiagram("diag-4" + j, "point-group", data1, d, [{label: "mean", value: mean }]);


        // Point with Volume diameters
        j++;
        el = document.createElement("div");
        el.setAttribute("id", "diag-4" + j);
        div7.appendChild(el);
                        
        // making a copy of data so that data does not change while drawing
        mgDiagram("diag-4" + j, "point-size", data1, d, [{label: "mean", value: mean }]);

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
        mgHistogram("diag-8" + j, _.pluck(data2, "price"), d, "price");	
        
    });	
}


/*

 . call R function: stats::sd(x=data)

*/ 
function go() {

    setAction("Getting data!", false, 0.85);
  
    var stmt = "", key = "",
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
    
    // isin
    stmt = (_.isEmpty(list_selected_symbols)) ? "" : ("ISIN IN (" + _.map(list_selected_symbols, function(d) {return '\'' + d + '\'';}).join(", ") + ") AND ") ;
      
    // Get new data
    stmt = "SELECT * FROM rd WHERE " + stmt + " Time BETWEEN '" + dates[0] + "' AND date('" + dates[j] + "', '+1 days') ORDER BY Time ASC, ISIN ASC";
    
    // if previous sql statement do not call data
    // 
    key = (djb2HashCode((stmt).replace(/ /g,''))).toString();
    
    if (_.keys(sql_data).indexOf(key) === -1) {
  
		sqliteSQL({"url": "/home/" + user + "/sql/rd1.db", "stmt": stmt}, function(f) {
  
			var txt = "", 
				i = 1;
  
			// ...
			if (_.isEmpty(f)) {
			
				//txt = (j === 0) ? ("No data available for: " + dates[0] + ".") : ("No data available from: " + dates[0] + " to: " + dates[j] + ".") ;

				//tekst("warning", "p", txt);
				message("search-text", "No data available for given Date(s) and ISIN code(s)!");
  
			} else {
  
				// ...
				data_all = addToRawData(f);
			
				// temporary local database
				sql_data[key] = data_all;
						
				// Possibly keep data and only call if new selections
				showTrades();
	  
				console.log("Fetched new data!");
				message("search-text", "Ok, data fetched!");
			}
	  
			// ...
		   clearAction();
		}); 
	
	} else {

        // place in local database
        data_all = sql_data[key];

	    showTrades();

		console.log("Re-used data!");

        message("search-text", "Ok, data fetched!");
        clearAction();
	}
	
	//sql_last_key = key;	
}


// --- init ---
uxInit();

  