# apikeys plugin

## Summary
The `apikeys` plugin allows you to secure API requests to Edge Microgateway with API Key validation. API Key validation is a slightly weaker form of security, since it only requires the client ID and not the secret or end user authentication.  This plugin was created to separate API key validation from OAuth 2.0 token validation and to simplify its configuration.

## When to use this plugin?
Use this plugin when you want to enable API Key validation.

## Process Summary

1. The client will obtain a client ID and secret.
2. The client will include the API Key on the request to Edge Microgateway.
3. The `apikeys` plugin will validate the API Key.
4. If the API Key is valid, then the request will continue to the next plugin, otherwise an error message will be returned to the client application.

## Prerequisites
Please complete the following tasks before you use this plugin.  

1. [Install MG](https://docs.apigee.com/api-platform/microgateway/3.0.x/setting-and-configuring-edge-microgateway#Prerequisite)   

2. [Configure MG](https://docs.apigee.com/api-platform/microgateway/3.0.x/setting-and-configuring-edge-microgateway#Part1)

3. [Create entities on Apigee Edge](https://docs.apigee.com/api-platform/microgateway/3.0.x/setting-and-configuring-edge-microgateway#Part2)


## Plugin configuration properties
The following properties can be set in the `apikeys` stanza in the Microgateway configuration file.

```yaml
apikeys:  
 # Header name used to send the API Key to Edge Microgateway
 # Default: x-api-key

 api-key-header: "x-custom-header"

 # Set to true if you want to send the api-key-header to the target server.
 # Set to false when you want this plugin to remove the header after it is validated.
 # Default: false

 keep-api-key: true

 # Set to true if you want to enable Edge Microgateway to cache the API Key with the JWT.
 # Set to false if you want to validate the API key with Apigee Edge SaaS on each request.
 # Default: false

 cacheKey: true

 # Set to true to enable Edge Microgateway to check against the resource paths only.  
 # In this case it ignores the proxy name check.  
 # Set to false to enable Edge Microgateway to check if the proxy name is included in the product.
 # Default: false

 productOnly: true
```

## Enable the plugin
Configure your Edge Microgateway configuration file (`org-env-config.yaml`) as shown below.

```yaml
plugins:
    sequence:
      - apikeys
      # other plugins can be listed here
```

## Configure the plugin
In the same configuration file you also need to configure the `apikeys` plugin if you want to change the default behavior.  The example below sets `cacheKey` to `true` (API Keys and JWTs are cached in Edge Microgateway) and it sets the `api-key-header` to `apikey`.  Therefore, clients must include a header on the request named `apikey: APIKEY_HERE`.

```yaml
apikeys:
  cacheKey: true
  api-key-header: "apikey"
```

## Caching
When Edge Microgateway validates the API Key, it sends the request to Apigee Edge SaaS and receives a JWT in the response.  This JWT can be cached along with the API Key so that Edge Microgateway does not need to validate the API Key on every request.  

### Cache Headers
The `apikeys` plugin observes the [`cache-control`](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching) header.  If a client application wants to cache the JWT, which is returned after the API Key is validated, then send the `cache-control` header set to any value except `no-cache`.  This will only cache the API Key and JWT associated with the request.  Other requests to Edge Microgateway will not be cached or fetched from the cache if the `cache-control` header is not included on the request.  

The alternative is to enable caching on Edge Microgateway by setting the `cacheKey` property to `true`.

## Best practices for configuring this plugin
* The `apikeys` plugin is typically listed first in the plugin sequence.  
* Set the `cacheKey` property to `true` to enable caching by default on the Microgateway.  This will avoid an API Key validation request to Apigee Edge SaaS on every request to Edge Microgateway.  

## To learn more
Please review the following OAuth plugin documentation.  
* [Microgateway existing plugins](https://docs.apigee.com/api-platform/microgateway/3.0.x/use-plugins#existingpluginsbundledwithedgemicrogateway)
* [Creating entities on Apigee Edge plugin](https://docs.apigee.com/api-platform/microgateway/3.0.x/setting-and-configuring-edge-microgateway.html#part2createentitiesonapigeeedge)
* [Secure the Microgateway with OAuth2.0](https://docs.apigee.com/api-platform/microgateway/3.0.x/setting-and-configuring-edge-microgateway.html#part4secureedgemicrogateway)
* [Secure the Microgateway with API Key validation](https://docs.apigee.com/api-platform/microgateway/3.0.x/setting-and-configuring-edge-microgateway.html#part4secureedgemicrogateway-securingtheapiwithanapikey)
