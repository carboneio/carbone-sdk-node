const assert = require('assert');
const path = require('path');
const sdk = require('../index')('CARBONE_API_KEY');
const fs = require('fs');
// eslint-disable-next-line node/no-unpublished-require
const nock = require('nock')

const CARBONE_URL = 'https://api.carbone.io/'

describe('Carbone SDK', () => {
  describe('Add template', () => {
    it('should add a persistant template', (done) => {
      const nockUpload = nock(CARBONE_URL,
        {
          badheaders: ['carbone-template-delete-after'],
        })
        .post((uri) => {
          return uri.includes('template')
        })
        .reply(200, {
          success: true,
          data: {
            templateId: 'fileTemplateId'
          }
        });

      sdk.addTemplate(path.join(__dirname, 'datasets', 'test.odt'), 'toto', (err, templateId) => {
        assert.strictEqual(err, null);
        assert.strictEqual(templateId, 'fileTemplateId');
        assert.strictEqual(nockUpload.pendingMocks().length, 0);
        done();
      });
    });

    it('should add a template from an URL (https)', (done) => {
      const nockUpload = nock(CARBONE_URL,
        {
          badheaders: ['carbone-template-delete-after'],
        })
        .post((uri) => {
          return uri.includes('template')
        })
        .reply(200, {
          success: true,
          data: {
            templateId: 'fileTemplateId'
          }
        });

      const nockDownload =nock(CARBONE_URL)
          .get((uri) => {
            return uri.includes('template/invoice.odt')
          })
          .reply(200, fs.createReadStream(path.join(__dirname, 'datasets', 'test.odt')));

      sdk.addTemplate(CARBONE_URL + 'template/invoice.odt', 'toto', (err, templateId) => {
        assert.strictEqual(err, null);
        assert.strictEqual(templateId, 'fileTemplateId');
        assert.strictEqual(nockDownload.pendingMocks().length, 0);
        assert.strictEqual(nockUpload.pendingMocks().length, 0);
        done();
      });
    });

    it('should add a template from an URL (http no S)', (done) => {
      const _URL = 'http://api.carbone.io/'
      const nockUpload = nock(_URL,
        {
          badheaders: ['carbone-template-delete-after'],
        })
        .post((uri) => {
          return uri.includes('template')
        })
        .reply(200, {
          success: true,
          data: {
            templateId: 'fileTemplateId'
          }
        });

      const nockDownload = nock(_URL)
          .get((uri) => {
            return uri.includes('template/invoice.odt')
          })
          .reply(200, fs.createReadStream(path.join(__dirname, 'datasets', 'test.odt')));

      sdk.setOptions({ carboneUrl: _URL });
      sdk.addTemplate(_URL + 'template/invoice.odt', 'toto', (err, templateId) => {
        sdk.setOptions({ carboneUrl: CARBONE_URL });
        assert.strictEqual(err, null);
        assert.strictEqual(templateId, 'fileTemplateId');
        assert.strictEqual(nockDownload.pendingMocks().length, 0);
        assert.strictEqual(nockUpload.pendingMocks().length, 0);
        done();
      });
    });

    it('should add a template from a Buffer', (done) => {
      const nockUpload = nock(CARBONE_URL,
        {
          badheaders: ['carbone-template-delete-after'],
        })
        .post('/template')
        .reply(200, (uri, body) => {
          assert.strictEqual(body.includes('toto'), true);
          assert.strictEqual(body.includes('{d.value}'), true);
          return {
            success: true,
            data: {
              templateId: 'fileTemplateId'
            }
          }
        })
      const _templateBuffer = Buffer.from("<html>{d.value}</html>");
      sdk.addTemplate(_templateBuffer, 'toto', (err, templateId) => {
        assert.strictEqual(err, null);
        assert.strictEqual(templateId, 'fileTemplateId');
        assert.strictEqual(nockUpload.pendingMocks().length, 0);
        done();
      });
    });



    it('should add a non persistant template', (done) => {
      sdk.setOptions({
        headers: {
          'carbone-template-delete-after': 86400
        }
      })

      nock(CARBONE_URL,
        {
          reqheaders: {
            'carbone-template-delete-after': headerValue => headerValue > 0,
          },
        })
        .post((uri) => {
          return uri.includes('template')
        })
        .reply(200, {
          success: true,
          data: {
            templateId: 'fileTemplateId'
          }
        });

      sdk.addTemplate(path.join(__dirname, 'datasets', 'test.odt'), 'toto', (err, templateId) => {
        assert.strictEqual(err, null);
        assert.strictEqual(templateId, 'fileTemplateId');
        sdk.setOptions({
          headers: {}
        })
        done();
      });
    });

    it('should add a template without payload', (done) => {
      nock(CARBONE_URL)
        .post((uri) => uri.includes('template'))
        .reply(200, {
          success: true,
          data: {
            templateId: 'newTemplateId'
          }
        });

      sdk.addTemplate(path.join(__dirname, 'datasets', 'test.odt'), (err, templateId) => {
        assert.strictEqual(err, null);
        assert.strictEqual(templateId, 'newTemplateId');
        done();
      });
    });

    it('should return an error if filepath is not absolute', (done) => {
      // eslint-disable-next-line no-unused-vars
      sdk.addTemplate('./relative', (err, templateId) => {
        assert.strictEqual(err.message, 'The template must be either: An absolute path, URL or a Buffer');
        done();
      })
    });

    it('should return an error if carbone return success = false', (done) => {
      nock(CARBONE_URL)
        .post((uri) => uri.includes('template'))
        .reply(200, {
          success: false,
          error: 'An error occured with the API'
        });

      // eslint-disable-next-line no-unused-vars
      sdk.addTemplate(path.join(__dirname, 'datasets', 'test.odt'), 'toto', (err, templateId) => {
        assert.strictEqual(err.message, 'An error occured with the API');
        done();
      });
    });

    it('should return an error from body if carbone return a statusCode different than 200', (done) => {
      nock(CARBONE_URL)
        .post((uri) => uri.includes('template'))
        .reply(400, {
          success: false,
          error: '400 server error'
        });

      // eslint-disable-next-line no-unused-vars
      sdk.addTemplate(path.join(__dirname, 'datasets', 'test.odt'), 'toto', (err, templateId) => {
        assert.strictEqual(err.message, '400 server error');
        done();
      });
    });

    it('should return an error with status message if body is undefined', (done) => {
      nock(CARBONE_URL)
        .post((uri) => uri.includes('template'))
        .reply(300);

      // eslint-disable-next-line no-unused-vars
      sdk.addTemplate(path.join(__dirname, 'datasets', 'test.odt'), 'toto', (err, templateId) => {
        // The status message is null because it cannot be set with nock
        assert.strictEqual(err.message, 'null');
        done();
      });
    });

    it('should return a request error', (done) => {
      nock(CARBONE_URL)
        .post((uri) => uri.includes('template'))
        .replyWithError('REQUEST ERROR');

      // eslint-disable-next-line no-unused-vars
      sdk.addTemplate(path.join(__dirname, 'datasets', 'test.odt'), 'toto', (err, templateId) => {
        assert.strictEqual(err.message, 'REQUEST ERROR');
        done();
      });
    });

    it('should retry the request if the request error is an ECONNRESET', (done) => {
      let mockRequest = nock(CARBONE_URL)
        .post((uri) => uri.includes('template'))
        .replyWithError({ code: 'ECONNRESET' })
        .post((uri) => uri.includes('template'))
        .reply(200, {
          success: true,
          data: {
            templateId: 'fileTemplateId'
          }
        });

      sdk.addTemplate(path.join(__dirname, 'datasets', 'test.odt'), 'toto', (err, templateId) => {
        assert.strictEqual(err, null);
        assert.strictEqual(templateId, 'fileTemplateId');
        assert.strictEqual(mockRequest.pendingMocks().length, 0);
        done();
      });
    });

    it('should retry the request only one time for a ECONNRESET error', (done) => {
      let mockRequest = nock(CARBONE_URL)
        .post((uri) => uri.includes('template'))
        .replyWithError({ code: 'ECONNRESET' })
        .post((uri) => uri.includes('template'))
        .replyWithError({ code: 'ECONNRESET', message: 'Connection reset' });

      // eslint-disable-next-line no-unused-vars
      sdk.addTemplate(path.join(__dirname, 'datasets', 'test.odt'), 'toto', (err, templateId) => {
        assert.strictEqual(err.message, 'Connection reset');
        assert.strictEqual(mockRequest.pendingMocks().length, 0);
        done();
      });
    });
  });

  describe('Delete template', () => {
    it('should delete a template', (done) => {
      nock(CARBONE_URL)
        .delete((uri) => uri.includes('template'))
        .reply(200, {
          success: true,
          error: null
        });

      sdk.delTemplate('templateId', (err) => {
        assert.strictEqual(err, null);
        done();
      });
    });

    it('should return an error if templateId is null', (done) => {
      sdk.delTemplate(null, (err) => {
        assert.strictEqual(err.message, 'Invalid template ID');
        done();
      });
    });

    it('should return an error if templateId is undefined', (done) => {
      sdk.delTemplate(undefined, (err) => {
        assert.strictEqual(err.message, 'Invalid template ID');
        done();
      });
    });

    it('should return error from body if success = false', (done) => {
      nock(CARBONE_URL)
        .delete((uri) => uri.includes('template'))
        .reply(200, {
          success: false,
          error: 'Error with your template ID'
        });

      sdk.delTemplate('templateId', (err) => {
        assert.strictEqual(err.message, 'Error with your template ID');
        done();
      });
    });

    it('should return statusMessage error if code is not 200', (done) => {
      nock(CARBONE_URL)
        .delete((uri) => uri.includes('template'))
        .reply(400);

      sdk.delTemplate('templateId', (err) => {
        // The status message is null because it cannot be set with nock
        assert.strictEqual(err.message, 'null');
        done();
      });
    });

    it('should return error from body if status is not 200 and body is defined', (done) => {
      nock(CARBONE_URL)
        .delete((uri) => uri.includes('template'))
        .reply(400, {
          success: false,
          error: 'Bad template ID'
        });

      sdk.delTemplate('templateId', (err) => {
        assert.strictEqual(err.message, 'Bad template ID');
        done();
      });
    });

    it('should return error if the request fails', (done) => {
      nock(CARBONE_URL)
        .delete((uri) => uri.includes('template'))
        .replyWithError('Request error');

      sdk.delTemplate('templateId', (err) => {
        assert.strictEqual(err.message, 'Request error');
        done();
      });
    });

    it('should retry the request if the first reponse is an ECONNRESET error', (done) => {
      nock(CARBONE_URL)
        .delete((uri) => uri.includes('template'))
        .replyWithError({ code: 'ECONNRESET' })
        .delete((uri) => uri.includes('template'))
        .reply(200, {
          success: true,
          error: null
        });

      sdk.delTemplate('templateId', (err) => {
        assert.strictEqual(err, null);
        done();
      });
    });

    it('should retry the request only one time before returning the ECONNREST error', (done) => {
      nock(CARBONE_URL)
        .delete((uri) => uri.includes('template'))
        .replyWithError({ code: 'ECONNRESET', message: 'ECONNRESET error' })
        .delete((uri) => uri.includes('template'))
        .replyWithError({ code: 'ECONNRESET', message: 'ECONNRESET error' });

      sdk.delTemplate('templateId', (err) => {
        assert.strictEqual(err.message, 'ECONNRESET error');
        done();
      });
    });
  });

  describe('Calculate hash', () => {
    it('should generate a hash', (done) => {
      sdk._calculateHash(path.join(__dirname, 'datasets', 'streamedFile.txt'), null, (err, hash) => {
        assert.strictEqual(err, null);
        assert.strictEqual(hash, 'e678c997d43d7bc0ed1d2d0be6abd66506d6a90cd120df114b707c9d91b59a11');
        done();
      });
    });

    it('should generate a different hash with a payload', (done) => {
      sdk._calculateHash(path.join(__dirname, 'datasets', 'streamedFile.txt'), 'toto', (err, hash) => {
        assert.strictEqual(err, null);
        assert.strictEqual(hash, '353f803d315bae5ffdc99a0c17dc04a990df10e30455ce057a419c5f80654489');
        done();
      });
    });
  });

  describe('Get template', () => {
    describe('Callback', () => {
      it('should return the content of the file in the callback', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          });

        sdk.getTemplate('templateId', (err, content) => {
          assert.strictEqual(err, null);
          assert.strictEqual(content.toString(), 'Hello I am the streamed file!\n');
          done();
        });
      });

      it('should return a file not found error if code is 404', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          .reply(404);

        // eslint-disable-next-line no-unused-vars
        sdk.getTemplate('templateId', (err, content) => {
          assert.strictEqual(err.message, 'File not found');
          done();
        });
      });

      it('should return an error with the code if the code is different than 200', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          .reply(303);

        // eslint-disable-next-line no-unused-vars
        sdk.getTemplate('templateId', (err, content) => {
          assert.strictEqual(err.message, 'Error 303: an error occured');
          done();
        });
      });

      it('should return an error if the request failed', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          .replyWithError('Request error');

        // eslint-disable-next-line no-unused-vars
        sdk.getTemplate('templateId', (err, content) => {
          assert.strictEqual(err.message, 'Request error');
          done();
        });
      });

      it('should return an error if the template ID is null', (done) => {
        // eslint-disable-next-line no-unused-vars
        sdk.getTemplate(null, (err, content) => {
          assert.strictEqual(err.message, 'Invalid template ID');
          done();
        });
      });

      it('should return an error if the template ID is undefined', (done) => {
        // eslint-disable-next-line no-unused-vars
        sdk.getTemplate(undefined, (err, content) => {
          assert.strictEqual(err.message, 'Invalid template ID');
          done();
        });
      });
    });

    describe('Get template filename', () => {
      it('should return the filename in headers', () => {
        let obj = {
          headers: {
            'content-disposition': 'filename="tata.txt"'
          }
        };

        let filename = sdk.getFilename(obj);
        assert.strictEqual(filename, 'tata.txt');
      });

      it('should return null if object has no headers key', () => {
        let obj = {
        };

        let filename = sdk.getFilename(obj);
        assert.strictEqual(filename, null);
      });

      it('should return null if headers has no content-disposition key', () => {
        let obj = {
          headers: {}
        };

        let filename = sdk.getFilename(obj);
        assert.strictEqual(filename, null);
      });

      it('should return null if content-disposition is empty', () => {
        let obj = {
          headers: {
            'content-disposition': ''
          }
        };

        let filename = sdk.getFilename(obj);
        assert.strictEqual(filename, null);
      });
    });

    describe('Stream', () => {
      let _filename = null;

      after(() => {
        if (_filename !== null) {
          fs.unlinkSync(path.join(__dirname, _filename));
        }
      });

      it('should return the content of the file with a stream and write the new file', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        let filename = 'test.txt';
        let writeStream = fs.createWriteStream(path.join(__dirname, filename));

        writeStream.on('close', () => {
          let newContentFile = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf8');
          assert.strictEqual(newContentFile, 'Hello I am the streamed file!\n');
          _filename = 'test.txt';
          done();
        });

        sdk.getTemplate('templateId').pipe(writeStream);
      });

      it('should return an error if the file does not exists', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          .reply(404);

        let filename = 'test.txt';
        let writeStream = fs.createWriteStream(path.join(__dirname, filename));
        let fileStream = sdk.getTemplate('templateId');

        fileStream.on('error', (err) => {
          assert.strictEqual(err.message, 'File not found');
          done();
        });

        fileStream.pipe(writeStream);
      });

      it('should return an error if carbone return another code than 200', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          .reply(300);

        let filename = 'test.txt';
        let writeStream = fs.createWriteStream(path.join(__dirname, filename));
        let fileStream = sdk.getTemplate('templateId');

        fileStream.on('error', (err) => {
          assert.strictEqual(err.message, 'Error 300: an error occured');
          done();
        });

        fileStream.pipe(writeStream);
      });

      it('should return an error if the request fails', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          .replyWithError('Request error');

        let filename = 'test.txt';
        let writeStream = fs.createWriteStream(path.join(__dirname, filename));
        let fileStream = sdk.getTemplate('templateId');

        fileStream.on('error', (err) => {
          assert.strictEqual(err.message, 'Request error');
          done();
        });

        fileStream.pipe(writeStream);
      });

      it('should return the filename in headers', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        let fileStream = sdk.getTemplate('templateId');
        let filename = 'test.txt';
        let writeStream = fs.createWriteStream(path.join(__dirname, filename));

        writeStream.on('close', () => {
          let filename = sdk.getFilename(fileStream)
          assert.strictEqual(filename, 'tata.txt');
          _filename = 'test.txt';
          done();
        });

        fileStream.pipe(writeStream);
      });
    });
  });

  describe('Render', () => {
    beforeEach(() => {
      sdk.setOptions({
        isReturningBuffer: true,
        retriesIntervalOnError: 0,
        retriesOnError: 1
      });
    });

    describe('Template as Absolute Path', () => {
      it('should render template with a path', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(path.join(__dirname, 'datasets', 'test.odt'), {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(sdk._getCache().get(path.join(__dirname, 'datasets', 'test.odt')), 'beb54d3436dd00b0871702f6f8ce7f5b641cdcfb1cfa07942cdf974094df2c1f');
          done();
        });
      });

      it('should render template with a path and a payload', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(path.join(__dirname, 'datasets', 'test.odt'), { payload: 'myPayload' }, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(sdk._getCache().get(path.join(__dirname, 'datasets', 'test.odt') + 'myPayload'), '94cd9cc739a678d1bf94310f1e60e4beea1348ed163b65236c7fbd207c327000');
          done();
        });
      });

      it('should render a template with a Template ID', (done) => {
        const _templateID = 'b94b02964087ade5026ac4607be30493983345e5fa22ddea3229fc650210436c';
        const nockRender = nock(CARBONE_URL)
          .post((uri) => uri.includes(_templateID))
          .reply(200, (uri, body) => {
            assert.strictEqual(body.data.value, true);
            return {
              success: true,
              data: {
                renderId: 'renderId'
              }
            };
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(_templateID, { data: { value: true } }, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(nockRender.pendingMocks().length, 0);
          done();
        });
      });

      it('should render template and overwrite headers for one request (WEBHOOK REQUEST)', (done) => {
        const nockResponses = nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, function() {
            assert.strictEqual(this.req.headers['carbone-version'], '3');
            assert.strictEqual(this.req.headers['carbone-webhook-url'], 'https://localhost:3000');
            return {
              success: true,
              error: null,
              data: {
                renderId: ''
              }
            }
          });

        sdk.render(path.join(__dirname, 'datasets', 'test.odt'), { payload: 'myPayload' }, { headers : { 'carbone-webhook-url' : 'https://localhost:3000', 'carbone-version' : '3'} }, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'A render ID will be sent to your webhook URL when the document is generated.');
          assert.strictEqual(filename, '');
          assert.strictEqual(sdk._getCache().get(path.join(__dirname, 'datasets', 'test.odt') + 'myPayload'), '94cd9cc739a678d1bf94310f1e60e4beea1348ed163b65236c7fbd207c327000');
          assert.strictEqual(nockResponses.pendingMocks().length, 0);
          done();
        });
      });

      it('should return an error with callback if hash cannot be calculated', (done) => {
        // eslint-disable-next-line no-unused-vars
        sdk.render('/file/does/not/exist', {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'ENOENT: no such file or directory, open \'/file/does/not/exist\'');
          done();
        });
      });

      it('should return an error with stream if the hash cannot be calculated when rendering', (done) => {
        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render('/file/does/not/exist', {});
        sdkStream.on('error', (err) => {
          assert.strictEqual(err.message, 'ENOENT: no such file or directory, open \'/file/does/not/exist\'');
          done();
        });

        sdkStream.pipe(writeStream)
      });
      it('should throw an error if the path is not absolute', () => {
        assert.throws(() => sdk.render('./template.odt', {}), new Error('The template must be: a template ID, or template URL, or template absolute path, or a template as Buffer'));
      });

    });

    describe('Template as URL', () => {
      it('should render template with an URL', (done) => {
        const nockRender = nock(CARBONE_URL)
          .post((uri) => uri.includes('template'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              templateID: 'templateID'
            }
          })
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

          const nockDownload = nock(CARBONE_URL)
            .defaultReplyHeaders({
              'content-type': 'text/html'
            })
            .get((uri) => uri.includes('template.html'))
            .reply(200, Buffer.from('<html>{d.value}</html>'));

        sdk.render(CARBONE_URL + 'template.html', {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(nockDownload.pendingMocks().length, 0);
          assert.strictEqual(nockRender.pendingMocks().length, 0);
          done();
        });
      });

      it('should throw an error if the URL return error 404', function(done) {
        const nockDownload = nock(CARBONE_URL)
            .defaultReplyHeaders({
              'content-type': 'text/html'
            })
            .get((uri) => uri.includes('template.html'))
            .reply(404);

        sdk.render(CARBONE_URL + 'template.html', {}, (err, buffer, filename) => {
          assert.strictEqual(err.toString(), 'Error: Downloading a template URL returned a 404 status code');
          assert.strictEqual(buffer, undefined)
          assert.strictEqual(filename, undefined)
          assert.strictEqual(nockDownload.pendingMocks().length, 0);
          done();
        });
      });

      it('should throw an error if the URL is not valid', function(done) {
        sdk.render('http://carbone   here.html', {}, (err, buffer, filename) => {
          assert.strictEqual(err.toString(), 'Error: The template URL is not valid');
          assert.strictEqual(buffer, undefined)
          assert.strictEqual(filename, undefined)
          done();
        });
      });
    });

    describe('Template as Buffer', () => {
      it('should render template with a Buffer', (done) => {
        const nockRender = nock(CARBONE_URL)
          .post((uri) => uri.includes('template'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              templateID: 'templateID'
            }
          })
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(Buffer.from('<html>{d.value}</html>'), {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(nockRender.pendingMocks().length, 0);
          done();
        });
      });
    });

    describe('One time rendering (carbone-template-delete-after:0) with URL / Buffer / Path', () => {
      it('should render template one time with a Buffer', (done) => {
        const _template = '<html>{d.value}</html>';
        const nockRender = nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, (uri, body) => {
            assert.strictEqual(body.data.value, true);
            assert.strictEqual(Buffer.from(body.template, 'base64').toString(), _template); // Ta-da
            return {
              success: true,
              error: null,
              data: {
                renderId: 'renderId'
              }
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(Buffer.from(_template), { data: { value: true } }, { headers: { 'carbone-template-delete-after': 0 } }, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(nockRender.pendingMocks().length, 0);
          done();
        });
      });

      it('should render template one time with an URL', (done) => {
        const _template = '<html>{d.value}</html>';
        const nockRender = nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, (uri, body) => {
            assert.strictEqual(body.data.value, true);
            assert.strictEqual(Buffer.from(body.template, 'base64').toString(), _template); // Ta-da
            return {
              success: true,
              error: null,
              data: {
                renderId: 'renderId'
              }
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });


        const nockDownload = nock(CARBONE_URL)
            .defaultReplyHeaders({
              'content-type': 'text/html'
            })
            .get((uri) => uri.includes('template.html'))
            .reply(200, Buffer.from(_template));

        sdk.render(CARBONE_URL + '/template.html', { data: { value: true } }, { headers: { 'carbone-template-delete-after': 0 } }, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(nockRender.pendingMocks().length, 0);
          assert.strictEqual(nockDownload.pendingMocks().length, 0);
          done();
        });
      });

      it('should render template one time with a Template PATH', (done) => {
        const _templatePath = path.join(__dirname, 'datasets', 'template.html');
        const _template = fs.readFileSync(_templatePath).toString();
        const nockRender = nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, (uri, body) => {
            assert.strictEqual(body.data.value, true);
            assert.strictEqual(Buffer.from(body.template, 'base64').toString(), _template); // Ta-da
            return {
              success: true,
              error: null,
              data: {
                renderId: 'renderId'
              }
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(_templatePath, { data: { value: true } }, { headers: { 'carbone-template-delete-after': 0 } }, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(nockRender.pendingMocks().length, 0);
          done();
        });
      });

      it('should NOT render template one time with a Template ID', (done) => {
        const _templateID = 'b94b02964087ade5026ac4607be30493983345e5fa22ddea3229fc650210436c';
        const nockRender = nock(CARBONE_URL)
          .post((uri) => uri.includes(_templateID))
          .reply(404, (uri, body) => {
            assert.strictEqual(body.data.value, true);
            assert.strictEqual(body.template, undefined); // Not rendering one time as the template is undefined
            return { "success" : false, "error" : "Template not found"};
          });

        sdk.render(_templateID, { data: { value: true } }, { headers: { 'carbone-template-delete-after': 0 } }, (err, buffer, filename) => {
          assert.strictEqual(err.toString(), 'Error: Template not found');
          assert.strictEqual(buffer, undefined);
          assert.strictEqual(filename, undefined);
          assert.strictEqual(nockRender.pendingMocks().length, 0);
          done();
        });
      });
    });

    describe('Callback', () => {
      const TEMPLATE_ID = 'd8f0ef8f77d246dda97de38aab3a86c247b46121e6818638d79a4fa00638cc14';

      it('should return an error if the template path is not absolute', (done) => {
        sdk.render('./template.ods', {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'The template must be: a template ID, or template URL, or template absolute path, or a template as Buffer');
          assert.strictEqual(buffer, undefined);
          assert.strictEqual(filename, undefined);
          done();
        });
      });

      it('should render a template without carbone version (the default one must be set 2.0.0)', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, function(uri, requestBody) {

            assert.strictEqual(this.req.headers['carbone-version'], '4');

            return {
              success: true,
              error: null,
              data: {
                renderId: 'renderId'
              }
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          done();
        });
      });

      it('should render a template with a specific version of carbone', (done) => {
        sdk.setApiVersion(2);
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, function(uri, requestBody) {
            assert.strictEqual(this.req.headers['carbone-version'], 2);

            return {
              success: true,
              error: null,
              data: {
                renderId: 'renderId'
              }
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          done();
        });
      });

      it('should upload the template if file is not found and render it', (done) => {
        let mock = nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(404, {
            success: false,
            error: 'File not found'
          })
          .post((uri) => uri.includes('template'))
          .reply(200, {
            success: true,
            data: {
              templateId: 'fileTemplateId'
            }
          })
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(path.join(__dirname, 'datasets', 'streamedFile.txt'), {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(mock.pendingMocks().length, 0);
          done();
        });
      });

      it('should return an error if upload template return an error', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(404, {
            success: false,
            error: 'File not found'
          })
          .post((uri) => uri.includes('template'))
          .reply(302, {
            success: false,
            error: 'Nope'
          });

        // eslint-disable-next-line no-unused-vars
        sdk.render(path.join(__dirname, 'datasets', 'streamedFile.txt'), {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'Nope');
          done();
        });
      });

      it('should retry post request once', (done) => {
        let mock = nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .replyWithError({ code: 'ECONNRESET' })
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(mock.pendingMocks().length, 0);
          done();
        });
      });

      it('should return an error if request failed two times', (done) => {
        let mock = nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .replyWithError({ code: 'ECONNRESET' })
          .post((uri) => uri.includes('render'))
          .replyWithError({ code: 'ECONNRESET', message: 'Aie' });

        // eslint-disable-next-line no-unused-vars
        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'Aie');
          assert.strictEqual(mock.pendingMocks().length, 0);
          done();
        });
      });

      it('should render a template with a link', (done) => {
        sdk.setOptions({
          isReturningBuffer: false
        });

        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId.pdf'
            }
          });

        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer, 'https://api.carbone.io/render/renderId.pdf');
          assert.strictEqual(filename, 'renderId.pdf');
          done();
        });
      });

      it('should return an error if POST request fails two times', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .replyWithError('Request error');

        // eslint-disable-next-line no-unused-vars
        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'Request error');
          done();
        });
      });

      it('should return an error if body is not a valid JSON object', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, 'Hello');

        // eslint-disable-next-line no-unused-vars
        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'Cannot parse body');
          done();
        });
      });

      it('should return an error carbone enigne return success = false', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: false,
            error: 'Invalid templateId'
          });

        // eslint-disable-next-line no-unused-vars
        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'Invalid templateId');
          done();
        });
      });

      it('should return response.statusMessage', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(404);

        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          // Response.statusMessage is 'null' because we can't set it with nock
          assert.strictEqual(err.message, 'null');
          assert.strictEqual(buffer, undefined);
          assert.strictEqual(filename, undefined);
          done();
        });
      });

      it('should return body.error message with a code different than 200', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(302, {
            success: false,
            error: 'Nope'
          });

        // eslint-disable-next-line no-unused-vars
        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'Nope');
          done();
        });
      });

      it('should return an error if get render return an error', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          .replyWithError('Request error');

        // eslint-disable-next-line no-unused-vars
        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'Request error');
          done();
        });
      });

      it('should return an error if get render return a 404 error', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(404);

        // eslint-disable-next-line no-unused-vars
        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'File not found');
          done();
        });
      });

      it('should return an error if get render return another code', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(302);

        // eslint-disable-next-line no-unused-vars
        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'Error 302: an error occured');
          done();
        });
      });

      it('should retry request once', (done) => {
        let mock = nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          .replyWithError({ code: 'ECONNRESET' })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(mock.pendingMocks().length, 0);
          done();
        });
      });

      it('should retry request once and return an error the second time', (done) => {
        let mock = nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          .replyWithError({ code: 'ECONNRESET' })
          .get((uri) => uri.includes('render'))
          .replyWithError({ code: 'ECONNRESET', message: 'No' });

        // eslint-disable-next-line no-unused-vars
        sdk.render(TEMPLATE_ID, {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'No');
          assert.strictEqual(mock.pendingMocks().length, 0);
          done();
        });
      });
    });

    describe('Stream', () => {
      let _filename = null;
      const TEMPLATE_ID = 'd8f0ef8f77d246dda97de38aab3a86c247b46121e6818638d79a4fa00638cc14';

      afterEach(() => {
        if (_filename !== null) {
          fs.unlinkSync(path.join(__dirname, _filename));
          _filename = null;
        }
      });

      it('should render a template', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render(TEMPLATE_ID, {});

        sdkStream.on('error', (err) => {
          assert.strictEqual(err, null);
        });

        writeStream.on('close', () => {
          let content = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf8')
          assert.strictEqual(content, 'Hello I am the streamed file!\n');

          let filename = sdk.getFilename(sdkStream);
          assert.strictEqual(filename, 'tata.txt');
          _filename = 'test.txt';
          done();
        });

        sdkStream.pipe(writeStream)
      });

      it('should return an error carbone enigne return success = false', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: false,
            error: 'Invalid templateId'
          });

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render(TEMPLATE_ID, {});

        sdkStream.on('error', (err) => {
          assert.strictEqual(err.message, 'Invalid templateId');
          done();
        });

        sdkStream.pipe(writeStream);
      });

      it('should return response.statusMessage', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(404);

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render(TEMPLATE_ID, {});

        sdkStream.on('error', (err) => {
          assert.strictEqual(err.message, 'null');
          done();
        });

        sdkStream.pipe(writeStream);
      });

      it('should return body.error message with a code different than 200', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(302, {
            success: false,
            error: 'Nope'
          });

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render(TEMPLATE_ID, {});

        sdkStream.on('error', (err) => {
          assert.strictEqual(err.message, 'Nope');
          done();
        });

        sdkStream.pipe(writeStream);
      });

      it('should return an error if get render return an error', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          .replyWithError('Request error');

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render(TEMPLATE_ID, {});

        sdkStream.on('error', (err) => {
          assert.strictEqual(err.message, 'Request error');
          done();
        });

        sdkStream.pipe(writeStream);
      });

      it('should return an error if get render return a 404 error', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(404);

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render(TEMPLATE_ID, {});

        sdkStream.on('error', (err) => {
          assert.strictEqual(err.message, 'File not found');
          done();
        });

        sdkStream.pipe(writeStream);
      });

      it('should return an error if get render return another error code', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(302);

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render(TEMPLATE_ID, {});

        sdkStream.on('error', (err) => {
          assert.strictEqual(err.message, 'Error 302: an error occured');
          done();
        });

        sdkStream.pipe(writeStream);
      });

      it('should retry both requests once with no delay', (done) => {
        var _start = process.hrtime();
        let mock = nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .replyWithError({ code: 'ECONNRESET' })
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          .replyWithError({ code: 'ECONNRESET' })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render(TEMPLATE_ID, {});

        sdkStream.on('error', (err) => {
          assert.strictEqual(err, null);
          done();
        });

        writeStream.on('close', () => {
          let content = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf8')
          assert.strictEqual(content, 'Hello I am the streamed file!\n');
          assert.strictEqual(mock.pendingMocks().length, 0);

          let filename = sdk.getFilename(sdkStream);
          assert.strictEqual(filename, 'tata.txt');
          _filename = 'test.txt';
          var _diff = process.hrtime(_start);
          var _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
          assert(_elapsed < 100);
          done();
        });

        sdkStream.pipe(writeStream);
      });

      it('should retry one time with a delay of 2 secondes ', (done) => {
        sdk.setOptions({ retriesOnError: 1, retriesIntervalOnError: 2000 });
        var _start = process.hrtime();
        let mock = nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .delay(0)
          .replyWithError({ code: 'ETIMEDOUT' })
          .post((uri) => uri.includes('render'))
          .delay(0)
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          .delay(0)
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render(TEMPLATE_ID, {});

        sdkStream.on('error', (err) => {
          assert.strictEqual(err, null);
          done();
        });

        writeStream.on('close', () => {
          let content = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf8')
          assert.strictEqual(content, 'Hello I am the streamed file!\n');
          assert.strictEqual(mock.pendingMocks().length, 0);

          let filename = sdk.getFilename(sdkStream);
          assert.strictEqual(filename, 'tata.txt');
          _filename = 'test.txt';
          var _diff = process.hrtime(_start);
          var _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
          assert(_elapsed >= 2000);
          done();
        });

        sdkStream.pipe(writeStream);
      });

      it('should retry 6 times with a delay of 500 ms ', (done) => {
        sdk.setOptions({ retriesOnError: 6, retriesIntervalOnError: 500 });
        var _start = process.hrtime();
        let mock = nock(CARBONE_URL)
          .post((uri) => uri.includes('render')).delay(0).replyWithError({ code: 'ECONNRESET' })
          .post((uri) => uri.includes('render')).delay(0).replyWithError({ code: 'ETIMEDOUT' })
          .post((uri) => uri.includes('render')).delay(0).replyWithError({ code: 'ESOCKETTIMEDOUT' })
          .post((uri) => uri.includes('render')).delay(0).replyWithError({ code: 'ECONNREFUSED' })
          .post((uri) => uri.includes('render')).delay(0).replyWithError({ code: 'ENOTFOUND' })
          .post((uri) => uri.includes('render')).delay(0).replyWithError({ code: 'EPIPE' })
          .post((uri) => uri.includes('render'))
          .delay(0)
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          .delay(0)
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render(TEMPLATE_ID, {});

        sdkStream.on('error', (err) => {
          assert.strictEqual(err, null);
          done();
        });

        writeStream.on('close', () => {
          let content = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf8')
          assert.strictEqual(content, 'Hello I am the streamed file!\n');
          assert.strictEqual(mock.pendingMocks().length, 0);

          let filename = sdk.getFilename(sdkStream);
          assert.strictEqual(filename, 'tata.txt');
          _filename = 'test.txt';
          var _diff = process.hrtime(_start);
          var _elapsed = ((_diff[0] * 1e9 + _diff[1]) / 1e6);
          assert(_elapsed >= 3000);
          done();
        });

        sdkStream.pipe(writeStream);
      });
    });
  });

  describe('Promise', () => {
    describe('Add template promise', () => {
      it('should add a persistant template', (done) => {
        nock(CARBONE_URL,
            {
              badheaders: ['carbone-template-delete-after'],
            }
          )
          .post((uri) => uri.includes('template'))
          .reply(200, {
            success: true,
            data: {
              templateId: 'fileTemplateId'
            }
          });

        sdk.addTemplatePromise(path.join(__dirname, 'datasets', 'test.odt'), 'toto').then((templateId) => {
          assert.strictEqual(templateId, 'fileTemplateId');
          done();
        })
        .catch((err) => {
          assert.strictEqual(err, null);
        });
      });

      it('should add a non persistant template', (done) => {
        sdk.setOptions({
          headers: {
            'carbone-template-delete-after': 86400
          }
        })

        nock(CARBONE_URL, {
            reqheaders: {
              'carbone-template-delete-after': headerValue => headerValue > 0,
            },
          })
          .post((uri) => uri.includes('template'))
          .reply(200, {
            success: true,
            data: {
              templateId: 'fileTemplateId'
            }
          });

        sdk.addTemplatePromise(path.join(__dirname, 'datasets', 'test.odt'), 'toto').then((templateId) => {
          assert.strictEqual(templateId, 'fileTemplateId');
          sdk.setOptions({
            headers: {}
          })

          done();
        })
        .catch((err) => {
          assert.strictEqual(err, null);
        });
      });

      it('should return an error', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('template'))
          .replyWithError('Request error');

        // eslint-disable-next-line no-unused-vars
        sdk.addTemplatePromise(path.join(__dirname, 'datasets', 'test.odt'), 'toto').then((templateId) => {
          assert.strictEqual(1, 2);
        })
        .catch((err) => {
          assert.strictEqual(err.message, 'Request error');
          done();
        });
      });
    });

    describe('Get template', () => {
      it('should return the content of the file', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          });

        sdk.getTemplatePromise('templateId').then((content) => {
          assert.strictEqual(content.toString(), 'Hello I am the streamed file!\n');
          done();
        })
        .catch((err) => {
          assert.strictEqual(err, null);
        });
      });

      it('should return an error', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          .replyWithError('Request error');

        // eslint-disable-next-line no-unused-vars
        sdk.getTemplatePromise('templateId').then((content) => {
          assert.strictEqual(1, 2);
        })
        .catch((err) => {
          assert.strictEqual(err.message, 'Request error');
          done();
        });
      });
    });

    describe('Del template', () => {
      it('should delete a template', (done) => {
        nock(CARBONE_URL)
          .delete((uri) => uri.includes('template'))
          .reply(200, {
            success: true,
            error: null
          });

        sdk.delTemplatePromise('templateId').then(() => {
          done();
        })
        .catch((err) => {
          assert.strictEqual(err, null);
        });
      });

      it('should return an error', (done) => {
        nock(CARBONE_URL)
          .delete((uri) => uri.includes('template'))
          .replyWithError('Request error');

        sdk.delTemplatePromise('templateId').then(() => {
          assert.strictEqual(1, 2);
        })
        .catch((err) => {
          assert.strictEqual(err.message, 'Request error');
          done();
        });
      });
    });

    describe('Render template', () => {
      it('should render a template', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId'
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.renderPromise(path.join(__dirname, 'datasets', 'test.odt'), {}).then((result) => {
          assert.strictEqual(result.content.toString(), 'Hello I am the streamed file!\n');
          assert.strictEqual(result.filename, 'tata.txt');
          done();
        })
        .catch((err) => {
          assert.strictEqual(err, null);
        });
      });

      it('should return an error', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .replyWithError('Request error');

        sdk.renderPromise(path.join(__dirname, 'datasets', 'test.odt'), {}).then(() => {
          assert.strictEqual(1, 2);
        })
        .catch((err) => {
          assert.strictEqual(err.message, 'Request error');
          done();
        });
      });

      it('should render template and overwrite headers for one request', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, function() {
            assert.strictEqual(this.req.headers['carbone-version'], '3');
            assert.strictEqual(this.req.headers['carbone-webhook-url'], 'https://localhost:3000');
            return {
              success: true,
              error: null,
              data: {
                renderId: 'renderId'
              }
            }
          })
          .get((uri) => uri.includes('render'))
          // eslint-disable-next-line no-unused-vars
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.renderPromise(path.join(__dirname, 'datasets', 'test.odt'), {}, { headers : { 'carbone-webhook-url' : 'https://localhost:3000', 'carbone-version' : '3'} }).then((result) => {
          assert.strictEqual(result.content.toString(), 'A render ID will be sent to your webhook URL when the document is generated.');
          assert.strictEqual(result.filename, '');
          done();
        })
        .catch((err) => {
          assert.strictEqual(err, null);
        });
      });
    });
  });
});
