# metrics plugin
 
## Summary
The `Alpha Release` of `Metrics plugin` collects stats of EMG requests and emits key performance indicators. Each worker process calculates total target response time, total proxy response time, etc. for each transaction during runtime and sends the data to `Admin server` for aggregation.
The Admin server runs on master process and exposes the data on HTTP endpoints.
 
## When to use this plugin?
Use this plugin to collect stats of EMG requests.

## Enable the metrics plugin 
Enable using CLI command edgemicro start. Provide below options.
 
Options: 
-m or --metrics  
 
Cli Command :
``` 
edgemicro start -o [org] -e [env] -k [key] -s [secret] -m
```

## Plugin configuration properties 
You can set the following properties in the `metrics` stanza in the Edge Microgateway configuration file.
 
```yaml
edgemicro: 
...
metrics:  
  port: 9000  # Default port will be (EMG PORT + 1)
  rollover_all: true  # Reset all proxy numeric KPI values if any one of the values of the proxy has reached max numeric value.

```

## How to access Admin Server Endpoints?
 
    /stats :

        Use /stats endpoint to collect kpi’s for all proxies 
        http://localhost:9000/stats 
 
    /stats/<proxy-name> : 
 
        Use /stats/<proxy-name> to collect kpi’s of a particular proxy  
        http://localhost:9000/stats/<proxy_name>

## Sample outputs
Stats server sample output data 

```
http://localhost:9000/stats 
{ 
   "edgemicro_weatherapi3":{ 
  	"name":"edgemicro_weatherapi3", 
  	"url":"http://mocktarget.apigee.net/json", 
  	"path":"/json", 
  	"target_host":"mocktarget.apigee.net", 
  	"target_url":"http://mocktarget.apigee.net/json", 
  	"time_taken_preflow_total":34, 
  	"time_taken_postflow_total":46, 
  	"time_taken_target_total":23, 
  	"time_taken_proxy_total":45, 
  	"count_proxy_2xx":1, 
  	"count_proxy_4xx":2, 
  	"count_proxy_5xx":0, 
  	"count_target_2xx":1, 
  	"count_target_4xx":0, 
  	"count_target_5xx":0, 
  	"count_proxy_total_req":3, 
  	"count_target_total_req_sent":1, 
  	"count_target_total_res_received":1, 
  	"last_update_timestamp":1597128996054 
   },
   "edgemicro_forecastApi":{ 
    ... 
   } 
}


http://localhost:9000/stats/edgemicro_weatherapi3

{ 
  	"name":"edgemicro_weatherapi3", 
  	"url":"http://mocktarget.apigee.net/json", 
  	"path":"/json", 
  	"target_host":"mocktarget.apigee.net", 
  	"target_url":"http://mocktarget.apigee.net/json", 
  	"time_taken_preflow_total":null, 
  	"time_taken_postflow_total":null, 
  	"time_taken_target_total":null, 
  	"time_taken_proxy_total":null, 
  	"count_proxy_2xx":1, 
  	"count_proxy_4xx":2, 
  	"count_proxy_5xx":0, 
  	"count_target_2xx":1, 
  	"count_target_4xx":0, 
  	"count_target_5xx":0, 
  	"count_proxy_total_req":3, 
  	"count_target_total_req_sent":1, 
  	"count_target_total_res_received":1, 
  	"last_update_timestamp":1597128996054 
}


```         