# Carbone Render Node SDK
![GitHub release (latest by date)](https://img.shields.io/github/v/release/carboneio/carbone-sdk-node?style=for-the-badge)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg?style=for-the-badge)](./API-REFERENCE.md)


The SDK to use [Carbone render](https://carbone.io) API easily.

> Carbone is a report generator (PDF, DOCX, XLSX, ODT, PPTX, ODS, XML, CSV...) using templates and JSON data.
[Learn more about the Carbone ecosystem](https://carbone.io/documentation.html).

## Install

```bash
$ npm i --save carbone-sdk
// OR
$ yarn add carbone-sdk
```

To use it, you will need your API key you can find on `Carbone Account` in the [API access](https://account.carbone.io/#/account/api) menu.

Once you have your API key, you can require the module.

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')
```

*INFO: Each request executed in the SDK is retry once if the first reponse request is a `ECONNRESET` error*

## Getting started

Try the following code to render a report in 10 seconds. Just replace your API key, the template you want to render, add data.

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

const options = {
  data: {
    /** YOUR DATA HERE **/
    firstname: "John",
    lastname:  "Wick"
  },
  convertTo: "pdf"
  /** List of other options: https://carbone.io/api-reference.html#render-reports **/
}

carboneSDK.render('/absolute/path/to/your/template', options, (err, buffer, filename) => {

})
```

## Carbone version

You can set the version of Carbone you want to use. With this, you can upgrade your carbone version when you are ready.

To set the version, call this function:

```js
carboneSDK.setApiVersion(3) // Set the version of carbone to 3
```

*Note:* You can only set the major version of carbone.

## API

All path you can give to carbone must be absolute path. Use the `path` module to get it.

```js
const absolutePath = path.join(__dirname, 'path', 'to', 'file.odt')
```

### Add a template

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

carboneSDK.addTemplate('/absolute/path/to/your/file', (err, templateId) => {

})
```

**WARNING:** The file path must be absolute.

You can add multiple times the same template and get different `templateId` thanks to the payload.

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

carboneSDK.addTemplate('/absolute/path/to/your/file', 'YOUR-PAYLOAD', (err, templateId) => {

})
```

### Get a template

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

carboneSDK.getTemplate('templateId', (err, content) => {

})
```

**WARNING:** The content returned is a buffer and not a string

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

The first way is to use the `templateId`.

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

const options = {
  data: { /** YOUR DATA HERE **/ },
  convertTo: "pdf"
  /** List of other options: https://carbone.io/api-reference.html#render-reports **/
}

carboneSDK.render('templateId', options, (err, buffer, filename) => {

})
```

Or if you don't want the buffer but juste the link to download it later, you can set the conf like this.

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

const options = {
  data: { /** YOUR DATA HERE **/ },
  convertTo: "pdf"
  /** List of other options: https://carbone.io/api-reference.html#render-reports **/
}

carboneSDK.setOptions({
  isReturningBuffer: false
})

carboneSDK.render('templateId', options, (err, downloadLink, filename) => {

})
```

The second way is to use the path of your local file. Using this method is the most safety way to avoid errors. Carbone engine deleted files which has not been used since a while. By using this method, if your file has been deleted, the SDK will automatically upload it again and return you the result.

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

const options = {
  data: {
    /** YOUR DATA HERE **/
    firstname: "John",
    lastname:  "Wick"
  },
  convertTo: "pdf"
  /** List of other options: https://carbone.io/api-reference.html#render-reports **/
}

carboneSDK.render('/absolute/path/to/your/file', options, (err, buffer, filename) => {

})
```

**WARNING:** If you want to set a payload, it must be located in the data object

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

const options = {
  data: { /** YOUR DATA HERE **/ },
  convertTo: "pdf"
  /** List of other options: https://carbone.io/api-reference.html#render-reports **/
}

carboneSDK.render('/absolute/path/to/your/file', options, (err, buffer, filename) => {

})
```

You can also render you template and get result with a stream.

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

const options = {
  data: { /** YOUR DATA HERE **/ },
  convertTo: "pdf"
  /** List of other options: https://carbone.io/api-reference.html#render-reports **/
}

const writeStream = fs.createWriteStream('result.pdf')
const sdkStream = carboneSDK.render('/absolute/path/to/your/file', options)

sdkStream.on('error', (err) => {

})

writeStream.on('close', () => {
  // Here you can get the real filename
  let filename = carboneSDK.getFilename(sdkStream)
})

sdkStream.pipe(writeStream)
```

## API Promise

All function of the SDK are also available with promise.

### Add a template

```js
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY')

carboneSDK.addTemplatePromise('/absolute/path/to/your/file', 'OPTIONAL-PAYLOAD')
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

const options = {
  data: { /** YOUR DATA HERE **/ },
  convertTo: "pdf"
  /** List of other options: https://carbone.io/api-reference.html#render-reports **/
}

carboneSDK.renderPromise('/absolute/path/to/your/file', options)
.then(result => {
  // result.content contains the rendered file
  // result.filename containes the rendered filename
})
.catch(err => {

})
```
