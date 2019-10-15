# cloud-foundry-route-service plugin

## Summary

The `cloud-foundry-route-service` plugin is only used in Cloud Foundry based environments (Pivotal Cloud Foundry, IBM Bluemix, etc.).  Cloud Foundry uses a [Go router](https://docs.cloudfoundry.org/concepts/architecture/router.html) and [Service Broker](https://docs.cloudfoundry.org/services/managing-service-brokers.html) to route requests within its environment.  This plugin will reset the target server path back to the original request that the client application sent to the Cloud Foundry.

## When to use this plugin?
Use this plugin when Edge Microgateway is running in a Cloud Foundry based environment.  The reason this plugin is required in Cloud Foundry environments is because the Go Router intercepts the request and forwards it to the **Service Broker** configured for the service.  

For example, if you have a service defined as `https://myservice.cf.net/products` and you configure the Apigee Service Broker with `https://mymicrogateway-instances.cf.net/cf-products`, then the Go Router will forward the request to Apigee with the provided domain name and path.

The client application sends a `GET` request to `https://myservice.cf.net/products` and the Go Router forwards the request to the Service Broker as shown below.

```
X-CF-Proxy-Signature: randomstring
X-CF-Forwarded-Url: https://myservice.cf.net/products

GET https://mymicrogateway-instances.cf.net/cf-products
```

When Edge Microgateway receives the request, it must change the `targetHostname` and `targetPath` to the original client request  sent to the Go Router.  This ensures that the Go Router knows where to send the request after the Service Broker performs its processing.   

## Process summary

Requests through the Cloud Foundry Go Router and Service Broker follow the general pattern below.
1. The client sends a request to Cloud Foundry https://my.cf.com/contacts
2. The Go Router intercepts the request and redirects it to the Service Broker which is bound for the service.
3. The Go Router injects two headers on the request to the Service Broker (`X-CF-Forwarded-Url` and `X-CF-Proxy-Signature`).
4. Go Router sends the request to the domain and resource path registered by the Service Broker, in this case Edge Microgateway.
5. Edge Microgateway receives the request applies the plugins; the `cloud-foundry-route-service` plugin rewrites the target request domain and the base path to the domain and path included in the `X-CF-Forwarded-Url`
6. Edge Microgateway sends the request back to the Go Router.
7. Cloud Foundry Go Router validates the `X-CF-Proxy-Signature`.
8. Go Router forwards the request to the target service.  

## Prerequisites

Review the following topics to install Edge Microgateway in a Cloud Foundry based environment.

1. [Microgateway  plan](https://docs.apigee.com/api-platform/integrations/cloud-foundry/proxying-cloud-foundry-app-microgateway-plan)   

2. [Microgateway Coresident plan](https://docs.apigee.com/api-platform/integrations/cloud-foundry/proxying-cloud-foundry-app-microgateway-coresident-plan)

## Plugin configuration properties

You can set the following properties in the `cloud-foundry-route-service` stanza in the Edge Microgateway configuration file.

```yaml
cloud-foundry-route-service:
  # Set this to true if you want to set the req.targetPath to the
  # path included in the x-cf-forwarded-url.
  # Set this to false if want to set the req.targetHostname and req.targetPath variables
  # to the values included in the x-cf-forwarded-url.
  # Default: false

  pathOnly: true
```

## Enable the plugin
Add the `cloud-foundry-route-service` plugin as the last plugin in the sequence.

```yaml
plugins:
    sequence:
      - oauthv2
      - quota
      - cloud-foundry-route-service
      # other plugins can be listed here
```

## Configure the plugin
In the same configuration file you also need to configure the `cloud-foundry-route-service` plugin if you want to change the default behavior.  The example below changes the `cloud-foundry-route-service` plugin to reset the `req.targetPath` variable to the path included in the  `X-CF-Forwarded-Url`. The `req.targetHostname` will remain the same.  

```yaml
cloud-foundry-route-service:
  pathOnly: true
```

## Best Practices for configuring this plugin
* This plugin should be the last plugin in the sequence.

## To learn more
To learn more, review the following documentation.  

* [Microgateway  plan](https://docs.apigee.com/api-platform/integrations/cloud-foundry/proxying-cloud-foundry-app-microgateway-plan)   

* [Microgateway Coresident plan](https://docs.apigee.com/api-platform/integrations/cloud-foundry/proxying-cloud-foundry-app-microgateway-coresident-plan)
