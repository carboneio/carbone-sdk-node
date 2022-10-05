### v1.2.0
  - The SDK request by default the latest version `v4.X.X` of Carbone Cloud API
  - Set requests header thanks to:
    ```
    sdk.setOptions({
      headers: {
        'carbone-template-delete-after': 86400
      }
    })
    ```

### v1.1.1
  - Update default Carbone API to version 3

### v1.1.0
  - Throw an error when a relative path is passed to the `render` function. Only absolute path are accepted.
  - It is possible retry to render a report with the following 2 configurations:
    - `retriesOnError` is the number of retries before returning the error. Default value: 1.
    - `retriesIntervalOnError` is the interval of time before retrying. Default value: 0ms.

    To change the default value, the `setOptions` method have to be used: `sdk.setOptions({ retriesOnError: 5, retriesIntervalOnError: 2000 });`

### v1.0.0
  - Release July 3rd, 2020
  - It is possible to interact with the Carbone Render API with the following methods:
    - addTemplate/addTemplatePromise: upload a template and return a templateID
    - getTemplate/getTemplatePromise: return an uploaded template from a templateID
    - deleteTemplate/delTemplatePromise: delete a template from a templateID
    - render/renderPromise: render a report from a templateID
