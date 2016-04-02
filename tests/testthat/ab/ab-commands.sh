#!/bin/sh

## https://httpd.apache.org/docs/2.4/programs/ab.html

## call:
#        ./ab-commands.sh test001.json 20 4

# first parameter is a json file with url and sql stmt
# second parameter is number of requests
# third parameter is number of concurrent requests per request
if [ $2 -lt $3 ]
then
  echo "second parameter n must be larger than third parameter c"
  exit
fi

ab -T "application/json" -p $1 -n $2 -c $3 https://riskbutler.net/ocpu/github/sinangabel/radar/R/sqliteget/json



## try different variations: number of codes, limits on codes, ...

# couchdb: ab -A "auth-username:password" -T "application/json" -n 100 -c 10 https://188.166.47.66:6984/sync14/_all_docs?keys=[%22usd-dkk%22,%22usd-eur%22,%22usd-gbp%22]&include_docs=true
# curl -k -g 'https://auth-username:password@188.166.47.66:6984/sync14/_all_docs?keys=[%22usd-dkk%22,%22usd-eur%22,%22usd-gbp%22]&include_docs=true' -H "Content-Type: application/json"
