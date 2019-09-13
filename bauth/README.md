# bauth plugin

## Summary
The `bauth` plugin enables basic authentication - `Authorization: Basic` - in Edge Microgateway.  However, Edge Microgateway does **not** validate the username and password that is provided in the request.  This plugin extracts the username and password from the Authorization header and creates two new request flow variables - `request.username` and `request.password`.  Create a custom plugin that sends a request to an authorization server to validate the username and password.  

## When to use this plugin?
Use this plugin when you want to enable basic authentication, but you must validate the username and password.  

## Prerequisites
Please complete the following tasks before you use this plugin.  

1. [Install MG](https://docs.apigee.com/api-platform/microgateway/3.0.x/setting-and-configuring-edge-microgateway#Prerequisite)   

2. [Configure MG](https://docs.apigee.com/api-platform/microgateway/3.0.x/setting-and-configuring-edge-microgateway#Part1)


## Plugin configuration properties
The following properties can be set in the `bauth` stanza in the Edge Microgateway configuration file.

```yaml
bauth:
  # Set to true if you want to send the Authorization header to the target server.
  # Set to false when you want this plugin to remove the header after it executes.
  # Default: false

  keep-authorization-header: true
```

## Enable the plugin
Include the `bauth` plugin in the plugins sequence section of the Edge Microgateway configuration file (`org-env-config.yaml`).

```yaml
plugins:
    sequence:
      - bauth
      # other plugins can be listed here
```

## Configure the plugin
In the same configuration file you also need to configure the `bauth` plugin if you want to change the default behavior.  This example sets `keep-authorization-header` to `true` to include the `Authorization` header on the request to the target server.    

```yaml
bauth:
  keep-authorization-header: true
```

## Errors
The plugin returns the following error messages.

### 401 Missing Authorization
This error is returned when the Authorization header is not included on the request.  
```
401 Unauthorized

{
  "error": "missing_authorization",
  "error_description": "Missing Authorization header"
}
```

### 400 Bad Request
This error is returned when the Authorization header is invalid, such as when the header is not `Authorization: Basic base64encoded(username:password)` or if the Authorization header does not include the Base64 encoded username and password.  
```
400 Bad Request

{
  "error": "invalid_request",
  "error_description": "Invalid Authorization header"
}
```

## Best Practices for configuring this plugin
* The `bauth` plugin should be used in conjunction with another plugin that validates the username and password after the `bauth` plugin executes.  
  * You can also modify this plugin to validate the username and password.  

## To learn more
* [Edge Microgateway Overview](https://docs.apigee.com/api-platform/microgateway/3.0.x/overview-edge-microgateway)
* [Edge Microgateway Getting Started Guide](https://docs.apigee.com/api-platform/microgateway/3.0.x/setting-and-configuring-edge-microgateway)
* [Edge Microgateway existing plugins](https://docs.apigee.com/api-platform/microgateway/3.0.x/use-plugins#existingpluginsbundledwithedgemicrogateway)
