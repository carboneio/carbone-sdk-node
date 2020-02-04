# Carbone Render SDK

The SDK to use [Carbone render](https://carbone.io) API easily.

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
const carboneSDK = require('carbone-sdk')('YOUR-API-KEY');

const data = {
  data: {
    // Add your data here
  },
  convertTo: 'pdf'
}

// Create a write stream with the report name as parameter.
const writeStream = fs.createWriteStream(path.join(__dirname, 'report.odt'))
// Pass the template path as first parameter, in this example 'test.odt' is the template.
// Pass the data object as second parameter.
const carboneStream = carboneSDK.render(path.join(__dirname, 'test', 'datasets', 'test.odt'), data)

carboneStream.on('error', (err) => {
  console.error(err)
})

writeStream.on('close', () => {
  console.log('File rendered')
})

carboneStream.pipe(writeStream)
```

## API

All path you can give to carbone must be absolute path. Use the `path` module to get it.

```js
const absolutePath = path.join(__dirname, 'path', 'to', 'file.odt')
```

### Add a template

```js
carbone.addTemplate('/absolute/path/to/your/file', (err, templateId) => {

})
```

**WARNING:** The file path must be absolute.

You can add multiple times the same template and get different `templateId` thanks to the payload.

```js
carbone.addTemplate('/absolute/path/to/your/file', 'YOUR-PAYLOAD', (err, templateId) => {

})
```

### Get a template

```js
carbone.getTemplate('templateId', (err, content) => {

})
```

**WARNING:** The content returned is a buffer and not a string

You can also get a template with stream.

```js
const writeStream = fs.createWriteStream('tmp.odt')
const carboneStream = carbone.getTemplate('templateId')

carboneStream.on('error', (err) => {

})

writeStream.on('close', () => {
  // Get the real filename here
  let filename = carbone.getFilename(carboneStream)
})

carboneStream.pipe(writeStream)
```

*The only way to get the filename when using stream is to wait the end of the request execution.*

### Delete a template

```js
carbone.delTemplate('templateId', (err) => {

})
```

### Render a template

There are multiple ways to render a template.

The first way is to use the `templateId`.

```js
const dataToRender = {}

carbone.render('templateId', dataToRender, (err, buffer, filename) => {

})
```

Or if you don't want the buffer but juste the link to download it later, you can set the conf like this.

```js
carbone.setOptions({
  isReturningBuffer: false
})

carbone.render('templateId', dataToRender, (err, downloadLink, filename) => {

})
```

The second way is to use the path of your local file. Using this method is the most safety way to avoid errors. Carbone engine deleted files which has not been used since a while. By using this method, if your file has been deleted, the SDK will automatically upload it again and return you the result.

```js
const dataToRender = {}

carbone.render('/absolute/path/to/your/file', dataToRender, (err, buffer, filename) => {

})
```

**WARNING:** If you want to set a payload, it must be located in the data object

```js
const dataToRender = {
  payload: 'MY-PAYLOAD'
}

carbone.render('/absolute/path/to/your/file', dataToRender, (err, buffer, filename) => {

})
```

You can also render you template and get result with a stream.

```js
const dataToRender = {}

const writeStream = fs.createWriteStream('result.pdf')
const sdkStream = carbone.render('/absolute/path/to/your/file', dataToRender)

sdkStream.on('error', (err) => {

})

writeStream.on('close', () => {
  // Here you can get the real filename
  let filename = carbone.getFilename(sdkStream)
})

sdkStream.pipe(writeStream)
```

## API Promise

All function of the SDK are also available with promise.

### Add a template

```js
carbone.addTemplatePromise('/absolute/path/to/your/file', 'OPTIONAL-PAYLOAD')
.then(templateId => {

})
.catch(err => {

})
```

### Get a template

```js
carbone.getTemplatePromise('templateId')
.then(content => {

})
.catch(err => {

})
```

### Delete a template

```js
carbone.delTemplatePromise('templateId', 'OPTIONAL-PAYLOAD')
.then(templateId => {

})
.catch(err => {

})
```

### Render a template

```js
const dataToRender = {}

carbone.renderPromise('/absolute/path/to/your/file', dataToRender)
.then(result => {
  // result.content contains the rendered file
  // result.filename containes the rendered filename
})
.catch(err => {

})
```
