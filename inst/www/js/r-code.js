"use strict";

/*
  . warning: https is necessary here
    done in init.js => ocpu.seturl("https://riskbutler.net/ocpu/github/sinangabel/radar/R")

  . warning: on local machine e.g. Mac set in .htaccess file => Header set Access-Control-Allow-Origin "*"

*/





/*
  . --- univariate ---

    yuimaSimulate({setseed: false, sumsim: false, nsim: 10, xinit: 100, drift: "mu * x", diffusion: "sigma * x", "hurst": 0.5, "solve.variable": "x", parameter: "list(mu = 0.1, sigma = 0.07)", terminal: 1, n: 10}, function(d) {return console.log(d); }) 
 
  . --- multivariate ---

      yuimaSimulate({setseed: false, sumsim: false, nsim: 10, xinit: "c(200,250)", drift: "c('mu1 * x1', 'mu2 * x2')", diffusion: "matrix(c('s1', '0', '0', 's2'),2,2)", hurst: 0.5, "solve.variable": "c('x1', 'x2')", parameter: "list(mu1 = 0.1, mu2 = 0.1, s1 = 0.07, s2 = 0.17)", terminal: 1, n: 10}, function(d) {return console.log(d); }) 
  
  . --- end ---

 . In R call as: yuima.simulate( setseed = FALSE, sumsim = FALSE, nsim = 100, drift = "mu * x", diffusion = "sigma * x", "hurst": 0.5, "solve.variable": "x", xinit = 100, parameter = list(mu = 0.1, sigma = 0.07), Terminal = 1, n = 10)

 . return format => see yuimaSimFilter() below
 . note: the spot price i.e. xnit is not returned but simply add it as the first observation, if needed
 
 . ToDo: 
    . trading times are currently equidistant: add also possibility to have specific trading times
       
*/
function yuimaSimulate(params, callback) {

    // filter required parameters => new "grid"
    var required_keys = ["setseed", "sumsim", "nsim", "xinit", "drift", "diffusion", "hurst", "solve.variable", "parameter", "terminal", "n"];  // warning: Terminal is required, and not terminal however as convention never use upper case parameter names in riskbutler.com
  
    params = _.pick(params, required_keys);
  
    if (! _.isEqual(_.union(_.keys(params), required_keys), required_keys)) {
        console.log("missing parameters");
        return;
    }
  
    // in yuima the name is with Upper case T
    params.Terminal = params.terminal;
  
    // remove params.terminal else we get an error in R yuima
    params = _.omit(params, "terminal");
 
    // snippet required
    params.parameter = new ocpu.Snippet(params.parameter);
    
    // if multivariate call
    if (params.drift.substr(0,1) === "c") {
    
       params.drift = new ocpu.Snippet(params.drift);
       params.diffusion = new ocpu.Snippet(params.diffusion);
       params.xinit = new ocpu.Snippet(params.xinit);
       params["solve.variable"] = new ocpu.Snippet(params["solve.variable"]);    
    }
    
    // callback check 
    if (_.isFunction(callback) === false) {
        console.log("callback not a function");
        return;
    } 
    
    // simulate
    var req = ocpu.rpc("yuima.simulate", params, function(res) {  
        
        callback(res);
    
    });  // end of rpc

    req.fail(function() {
        console.log("R returned an error: ", req.responseText);
    });

    req.always(function() {
		console.log("R called!");  
	});
}


/*
  
  . --- univariate ---
          tt = 500
          T = 1
          data = pricePathxN({"model": "GBM", "spot": 110, "timehorizon": T, "interest": 5.5, "volatility": 20, "dividends": 0, "tt": tt, "n": 1});
          data = numeric.log(_.flatten(data));
      
      yuimaQMLE({data: data, drift: "mu * x", diffusion: "sigma * x", "hurst": 0.5, "solve.variable": "x", method: "L-BFGS-B", start: "list(mu = 0.10, sigma = 0.1)", lower: "list(mu = 0, sigma = 0)", upper: "list(mu = 0.50, sigma = 1)", delta: T/tt}, function(d) {return console.log(d); })

  . --- multivariate ---
      
          tt = 500
          T = 1
          data = pricePathxN({"model": "GBM", "spot": 110, "timehorizon": T, "interest": 5.5, "volatility": 20, "dividends": 0, "tt": tt, "n": 2});
          data = numeric.log(numeric.transpose(data));
          data = {x1: data[0], x2: data[1]};
      
      yuimaQMLE({data: data, drift: "c('mu1 * x1', 'mu2 * x2')", diffusion: "matrix(c('s1', '0', '0', 's2'),2,2)", "hurst": 0.5, "solve.variable": "c('x1', 'x2')", method: "L-BFGS-B", start: "list(mu1 = 0.1, mu2 = 0.1, s1 = 0.1, s2 = 0.1)", lower: "list(mu1 = 0, mu2 = 0, s1 = 0, s2 = 0)", upper: "list(mu1 = 5, mu2 = 5, s1 = 5, s2 = 5)", delta: T/tt}, function(d) {return console.log(d); })
 
  . --- end ---
 
  . data input format: {x1: data[1,2,3,...], x2: data[4,5,6,...]}  possibly use data = numeric.log(numeric.transpose(data as matrix))
  
  . Yuima: see 1.13.4 The CKLS family of models
  
  . .../ocpu/library/yuima/R/qmle
    
*/
function yuimaQMLE(params, callback) {

    // filter required parameters
    var required_keys = ["drift", "diffusion", "hurst", "solve.variable", "method", "start", "lower", "upper", "delta", "data"];  // warning: Terminal is required, and not terminal however as convention never use upper case parameter names in riskbutler.com
  
    params = _.pick(params, required_keys);
  
    if (! _.isEqual(_.union(_.keys(params), required_keys), required_keys)) {
        console.log("missing parameters");
        return;
    }
 
    params.start = new ocpu.Snippet(params.start);
    params.lower = new ocpu.Snippet(params.lower);
    params.upper = new ocpu.Snippet(params.upper);

    // if multivariate call
    if (params.drift.substr(0,1) === "c") {
    
        params.drift = new ocpu.Snippet(params.drift);
        params.diffusion = new ocpu.Snippet(params.diffusion);
        params["solve.variable"] = new ocpu.Snippet(params["solve.variable"]);
    }
    
    // callback check 
    if (_.isFunction(callback) === false) {
        console.log("callback not a function");
        return;
    } 
    
    // continue
    var req = ocpu.rpc("yuima.qmle", params, function(res) {
      
        callback(JSON.parse(res));
        
    }); 

    req.fail(function() {
        console.log("R returned an error: ", req.responseText);
    });

    req.always(function(){
	    console.log("R called!");  
	});
}


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


/*  --- TEMPLATE ---

    //create snippet argument
    var x = new ocpu.Snippet($("#input").val());
    
    //disable button
    $("button").attr("disabled", "disabled");

    //perform the request
    var req = ocpu.call("mean", {
        "x" : x
    }, function(session){
        session.getConsole(function(outtxt){
            $("#output").text(outtxt); 
        });
    });
        
    //if R returns an error, alert the error message
    req.fail(function(){
        alert("Server error: " + req.responseText);
    });      
    
    req.always(function(){
        $("button").removeAttr("disabled");    
    });
*/


/*
 . params: ["drift", "diffusion", "hurst", "solve.variable", "method", "start", "lower", "upper", "delta", "data", "xinit", "n", "terminal"]
  
 . ToDo: generalise this function to allow for general R radar yuima calls i.e. multivariate 
  
 . see also: yuimaSimFilter()
*/
function yuimaOnce(params, callback) {

	// required parameters: ["drift", "diffusion", "hurst", "solve.variable", "method", "start", "lower", "upper", "delta", "data"]
	yuimaQMLE(params, 
	  
		function(d) {
	
			//var coef = _.object(_.pluck(d.coef, "_row"), d.coef),
			var	parameter = "",
				doc = {};
		
			//if ((! _.isNumber(coef.mu.Estimate)) || (! _.isNumber(coef.sigma.Estimate))) {
			//	console.log("Bad parameter estimates: ", coef);
			//	return [];
		    //
			//} else {
		
		        // ToDo: check the values of the parameters
		        // e.g.  =>  "list(th3 = 0.9999, th1 = 0.1, th2 = 0.092)"
				parameter = "list(" + _.map(d.coef, function(d) {return d._row + " = " + d.Estimate;  }).join(", ") + ")";
				
				// ToDo: n=tt > 1; xinit for multivariate;
				_.extend(doc, {setseed: false, sumsim: false, xinit: 1, nsim: params.n, n: 1, parameter: parameter}, _.pick(params, "drift", "diffusion", "hurst", "solve.variable", "terminal"));
                
                console.log("Estimation doc: ", doc);

				// required parameters: ["setseed", "sumsim", "nsim", "xinit", "drift", "diffusion", "hurst", "solve.variable", "parameter", "terminal", "n"]
				yuimaSimulate(doc,
					
					function(d) {

						// note: sim from yuima is for a value of 1 i.e. the xinit, therefore the post-multiplication
						// currently: remove spot price which is a constant = pos_transf.value
						// ToDo: do not use flatten to enable multi-variate and n>1 trading times
						return callback(yuimaSimFilter(d, doc, params));
							   
				});  // yuimaSimulate  
			//}               
	});  // yuimaQMLE
}


/*
 . yuimaSimFilter()
 
  . return formats from R radar package on cloud server: where n or grids are the same as trading times (tt) in riskbutler .js code. Also sometimes denoted (z) as counter
 
   n or grid   # variates   nsim
   ---------   ----------   ----
  1. n >= 1           1         =1  => [n1,n2,n3,...]
  2. n >= 1          >1         =1  => [n=1:[v=1,v=2 ...], n=2:[v=1,v=2], ...]
   
  3. n = 1            1         >1  => [[n=1], [n=1], ...]  one sim number in each array
  4. n > 1            1         >1  => [[n=1,n=2 ...], [n=1,n=2 ...], ...] first element in first array is first sim for n===1, next element in first array is first sim for n===2 etc.
  5. n = 1            >1        >1  => [[v=1,v=2 ...], [v=1,v=2 ...], ...] first element in first array is first sim for variate 1, next element in first array is first sim for variate 2 etc.
  6. n > 1            >1        >1  => [n=1:[v=1,v=2 ...], n=2:[v=1,v=2], ...] the values for the different trading times n rotate so for e.g. n=3: n=1,n=2,n=3,n=1,n=2,n=3,n=1,...

 
 . ToDo: allow for specific grid of trading times
 
 .     . test this function
 
 . See also: runSim_GBM() (which esssentially is multiPricePathxN()) and positionTransformation()
 
 . return format: of runSim_GBM(), multiPricePathxN()  =>  [doc.n===tt][Xi][nsim]  => possibly use the same here
   ... i.e. consider to use a fixed return format here!!!
   
 . return format: simCallBack() (which mostly calls positionTransformation())  =>  [tt:1{posTransf.}, tt:2{posTransf.}, ...] 
 
*/
function yuimaSimFilter(d, doc, params) {

    if (doc.nsim === 1 && _.isNumber(doc.xinit)) {  // case 1.
        
        return numeric.mul(d, params.xinit);                     // => [n1,n2,n3,...]
    
    } else if (doc.nsim === 1 && (! _.isNumber(doc.xinit))) {  // case 2.
        
        return numeric.transpose(d);  // ToDo: xnit multiplication
    
    } else if (doc.nsim > 1 && _.isNumber(doc.xinit) && doc.n === 1) {  // case 3 which is the single trading time version of case 4.
        
        return [[numeric.mul(_.flatten(d), params.xinit)]];          // => [[[n1,n1,n1 ...]]] i.e. [1][1][nsim]

    } else if (doc.nsim > 1 && _.isNumber(doc.xinit) && doc.n > 1) {  // case 4.
        
        return _.map(numeric.transpose(numeric.mul(d, params.xinit)), function(d) {return [d]; });  // => [tt=n>1][1][nsim]

    } else if (doc.nsim > 1 && (! _.isNumber(doc.xinit)) && doc.n === 1) {  // case 5.
        
        return d;  // must multiply relevant xinit value on each assets/portfolios time series
        
    } else if (doc.nsim > 1 && (! _.isNumber(doc.xinit)) && doc.n > 1) {  // case 6.
        
        return d;  // ToDo! first pick n1, n2, n3 in a rotating fashion, then transpose each of these n's to get the Xi's
    }
}


/*

*/
function yuimaMakeArgs(nargs) {
    
    var obj = {};
    
    // drift
    b = _.map(range(nargs), function(d) {return "x"+d;})

    obj.drift = "c(" + b.join(", ") + ")";
    
    
    return obj;
}



















// --- End of file ---

//PRODUCTION:})();
