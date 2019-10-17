# spikearrest plugin

## Summary

The `spikearrest` plugin protects against traffic spikes. It throttles the number of requests processed by an Edge Microgateway instance.

## When to use this plugin?

Use this plugin when you want to restrict the number of API requests to Edge Microgateway without respect to a user or client application.  


## Plugin configuration properties

You can set the following properties in the `spikearrest` stanza in the Edge Microgateway configuration file.

```yaml
spikearrest:
  # How often the spike arrest execution window resets. Valid values are seconds or minutes.
  # Default: none

  timeUnit: minute

  # The maximum number of requests to allow during the timeUnit.
  # Default: none

  allow: 10

  # bufferSize is optional. If bufferSize > 0, SpikeArrest will attempt to smooth requests by
  # returning only when the next appropriate execution window is available.
  # bufferSize is how many requests to "queue" before returning (immediately) with a isAllowed = false.
  # Default: 0

  bufferSize: 5
```

## Enable the plugin

In the Edge Microgateway configuration file (`org-env-config.yaml`) make sure that your plugin sequence is as shown below.  Typically, the `spikearrest` plugin is listed first in the plugin sequence, but this is not mandatory.  

```yaml
plugins:
    sequence:
      - spikearrest
      - oauth
```

## Configure the plugin

In the same configuration file you also need to configure the `spikearrest` plugin if you want to change the default behavior.  The example below changes the `spikearrest` plugin to allow 10 requests per minute and it buffers a maximum of 50 requests before returning an error to the client for subsequent requests.    

```yaml
spikearrest:
  timeUnit: minute
  allow: 10
  bufferSize: 50
```

## Best Practices for configuring this plugin

* The `spikearrest` plugin is typically listed first in the plugin sequence.  
* When Edge Microgateway starts it spawns worker processes based on the number of CPU cores, so if you have an 8 core machine, then it will spawn 8 worker processes.  Each work process will have its own spike arrest counter.  Therefore, you should consider the total number of requests that you want Edge Microgateway to allow and divide by the CPU core count.  This will effectively ensure that your total allowed count is applied.  
  * Use the `EDGEMICRO_PROCESSES` environment variable to restrict the number of work processes that Edge Microgateway spawns when it starts.

## Errors
If triggered, the `spikearrest` generates the following error message.

```
HTTP/1.1 503 Service Unavailable
Date: Thu, 17 Oct 2019 14:51:25 GMT
Connection: keep-alive
Content-Length: 46

{"message":"SpikeArrest engaged","status":503}%
```

## To learn more

Review the following `spikearrest` plugin documentation.  
* [Spike Arrest Plugin](https://docs.apigee.com/api-platform/microgateway/3.0.x/use-plugins#usingthespikearrestplugin-addingthespikearrestplugin)
* Dependencies
  * [volos-spikearrest-memory](https://www.npmjs.com/package/volos-spikearrest-memory) module.  
