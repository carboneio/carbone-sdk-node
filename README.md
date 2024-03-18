# Carbone Cloud API Node SDK
![GitHub release (latest by date)](https://img.shields.io/github/v/release/carboneio/carbone-sdk-node?style=for-the-badge)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg?style=for-the-badge)](./API-REFERENCE.md)


The SDK to use [Carbone Cloud API](https://carbone.io) easily.

> Carbone is a report generator (PDF, DOCX, XLSX, ODT, PPTX, ODS, XML, CSV...) using templates and JSON data.
[Learn more about the Carbone ecosystem](https://carbone.io/documentation.html).

## Install

```bash
$ npm i --save carbone-sdk
// OR
$ yarn add carbone-sdk
```

## Getting started

Try the following code to generate a report in 10 seconds. Insert:
* Your API key ([available on Carbone account](https://account.carbone.io/))
* The absolute path to your template (created from your text editor)
* The JSON data-set you want to inject inside the document

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')
const path       = require('path');

const body = {
  data: {
    /** YOUR DATA HERE **/
    firstname: "John",
    lastname:  "Wick"
  },
  convertTo: "pdf"
  /** List of other options: https://carbone.io/api-reference.html#render-reports **/
}

/** The template path must be absolute. Use the `path` module to get it. **/
const templateAbsolutePath = path.join(__dirname, 'path', 'to', 'template.odt')
/** Generate the document **/
carboneSDK.render(templateAbsolutePath, body, (err, buffer, filename) => {
/**
 * ✅ Document generated, returned values:
 * - "buffer": generated document as Buffer
 * - "Filename": document name as String
 * 
 * Now you can save the file or Stream it!
 **/
})
```
Note: Each request executed in the SDK is retry once if the first reponse request is a `ECONNRESET` errors

## API

### Change Carbone version

To choose a specific version of Carbone Render API, use the following function.
It is only possible to set a major version of Carbone.
```js
// Set the version of carbone to 4
carboneSDK.setApiVersion(4)
```

### Update default options / headers

```js
carboneSDK.setOptions({
  // Edit headers for all requests (default)
  headers: {
    'carbone-template-delete-after': 86400
  },
  // Edit the default Carbone URL (https://api.carbone.io/) for On-Premise
  // WARNING: Add a trailing slash to the end of your URL
  carboneUrl: 'https://your-on-premise-carbone-url:4000/'
})
```


### Add a template

When a template is uploaded, a `Template ID` is created which is the unique identifier for the template. If you upload the same template twice, you will have the same Template ID.
From the template you can:
* Generate a report
* Delete a template
* Download a template

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY');
const path       = require('path');

/** The template path must be absolute. Use the `path` module to get it. **/
const templateAbsolutePath = path.join(__dirname, 'path', 'to', 'template.odt')
carboneSDK.addTemplate(templateAbsolutePath, (err, templateId) => {

})
```

### Get a template

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

carboneSDK.getTemplate('templateId', (err, fileContentAsBuffer) => {
  /** Note: The content returned is a buffer and not a string **/
})
```

You can also get a template with stream.

```js
const writeStream = fs.createWriteStream('tmp.odt')
const carboneStream = carboneSDK.getTemplate('templateId')

carboneStream.on('error', (err) => {

})

writeStream.on('close', () => {
  // Get the real filename here
  let filename = carboneSDK.getFilename(carboneStream)
})

carboneStream.pipe(writeStream)
```

*The only way to get the filename when using stream is to wait the end of the request execution.*

### Delete a template

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

carboneSDK.delTemplate('templateId', (err) => {

})
```

### Render a template

There are multiple ways to render a template.

The first solution is to use a `templateId` (previously created from the method "addTemplate").

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

const body = {
  data: { /** YOUR DATA HERE **/ },
  convertTo: "pdf"
  /** List of other options: https://carbone.io/api-reference.html#render-reports **/
}

carboneSDK.render('templateId', body, (err, buffer, filename) => {

})
```

Or if you don't want the buffer but just the link to download it later, you can set the options `isReturningBuffer: false` to the SDK.

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

const body = {
  data: { /** YOUR DATA HERE **/ },
  convertTo: "pdf"
  /** List of other options: https://carbone.io/api-reference.html#render-reports **/
}

carboneSDK.setOptions({
  isReturningBuffer: false
})

carboneSDK.render('templateId', body, (err, downloadLink, filename) => {

})
```

The second solution (and easiest one) is to write the path of your local file, not the template ID. By using this method, if your template does not exist or has been deleted, the SDK will automatically:
* upload the template
* generate the report
* download the report as Buffer

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

const body = {
  data: {
    /** YOUR DATA HERE **/
    firstname: "John",
    lastname:  "Wick"
  },
  convertTo: "pdf"
  /** List of other options: https://carbone.io/api-reference.html#render-reports **/
}

carboneSDK.render('/absolute/path/to/your/template', body, (err, buffer, filename) => {

})
```
You can also render you template and get result with a stream.

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

const body = {
  data: { /** YOUR DATA HERE **/ },
  convertTo: "pdf"
  /** List of other options: https://carbone.io/api-reference.html#render-reports **/
}

const writeStream = fs.createWriteStream('result.pdf')
const sdkStream = carboneSDK.render('/absolute/path/to/your/template', body)

sdkStream.on('error', (err) => {

})

writeStream.on('close', () => {
  // Here you can get the real filename
  let filename = carboneSDK.getFilename(sdkStream)
})

sdkStream.pipe(writeStream)
```


You can also overwrite headers with an optional object. Here is an example to use Carbone webhooks: 

```js

const options = {
  headers = {
    'carbone-webhook-url': 'https://...'
  }
}

carboneSDK.render('templateId', body, options, (err, buffer, filename) => {

})
```


## API Promise

All function of the SDK are also available with promise.

### Add a template

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

carboneSDK.addTemplatePromise('/absolute/path/to/your/template', 'OPTIONAL-PAYLOAD')
.then(templateId => {

})
.catch(err => {

})
```

### Get a template

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

carboneSDK.getTemplatePromise('templateId')
.then(content => {

})
.catch(err => {

})
```

### Delete a template

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

carboneSDK.delTemplatePromise('templateId', 'OPTIONAL-PAYLOAD')
.then(templateId => {

})
.catch(err => {

})
```

### Render a template

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

const body = {
  data: { /** YOUR DATA HERE **/ },
  convertTo: "pdf"
  /** List of other options: https://carbone.io/api-reference.html#render-reports **/
}

// You can also overwrite headers with an optional object. Here is an example to use Carbone webhooks:
const options = {
  headers : {
    'carbone-webhook-url': 'https://...' // if you 
  }
}

carboneSDK.renderPromise('/absolute/path/to/your/template', body [, options])
.then(result => {
  // result.content contains the rendered file
  // result.filename containes the rendered filename
})
.catch(err => {

})
```
