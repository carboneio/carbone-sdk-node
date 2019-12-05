const assert = require('assert');
const path = require('path');
const sdk = require('../index')('CARBONE_API_KEY');
const nock = require('nock');
const fs = require('fs');

const CARBONE_URL = 'https://render.carbone.io/'

describe('Carbone SDK', () => {
  describe('Add template', () => {
    it('should add a template', (done) => {
      nock(CARBONE_URL)
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
      sdk.addTemplate('./relative', (err, templateId) => {
        assert.strictEqual(err.message, 'Your path must be an absolute path');
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

      sdk.addTemplate(path.join(__dirname, 'datasets', 'test.odt'), 'toto', (err, templateId) => {
        assert.strictEqual(err.message, '400 server error');
        done();
      });
    });

    it('should return an error with status message if body is undefined', (done) => {
      nock(CARBONE_URL)
        .post((uri) => uri.includes('template'))
        .reply(300);

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
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          });

        sdk.getTemplate('templateId', (err, content) => {
          assert.strictEqual(err, null);
          assert.strictEqual(content, 'Hello I am the streamed file!\n');
          done();
        });
      });

      it('should return a file not found error if code is 404', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          .reply(404);

        sdk.getTemplate('templateId', (err, content) => {
          assert.strictEqual(err.message, 'File not found');
          done();
        });
      });

      it('should return an error with the code if the code is different than 200', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          .reply(303);

        sdk.getTemplate('templateId', (err, content) => {
          assert.strictEqual(err.message, 'Error 303: an error occured');
          done();
        });
      });

      it('should return an error if the request failed', (done) => {
        nock(CARBONE_URL)
          .get((uri) => uri.includes('template'))
          .replyWithError('Request error');

        sdk.getTemplate('templateId', (err, content) => {
          assert.strictEqual(err.message, 'Request error');
          done();
        });
      });

      it('should return an error if the template ID is null', (done) => {
        sdk.getTemplate(null, (err, content) => {
          assert.strictEqual(err.message, 'Invalid template ID');
          done();
        });
      });

      it('should return an error if the template ID is undefined', (done) => {
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
        isReturningBuffer: true
      });
    });

    describe('With path', () => {
      it('should render template with a path', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(path.join(__dirname, 'datasets', 'test.odt'), {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer, 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(sdk._getCache().get(path.join(__dirname, 'datasets', 'test.odt')), '10e6a76d8503a18962fb3d889b628ae749e8423c0d626e687b5216e3998686e8');
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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(path.join(__dirname, 'datasets', 'test.odt'), { payload: 'myPayload' }, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer, 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(sdk._getCache().get(path.join(__dirname, 'datasets', 'test.odt') + 'myPayload'), '2b8168ba189026f0492aff8e3702a273862cd84ea5f1d07c8882ea3fcc36550c');
          done();
        });
      });

      it('should return an error with callback if hash cannot be calculated', (done) => {
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
    });

    describe('Callback', () => {
      it('should render a template', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render('templateId', {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer, 'Hello I am the streamed file!\n');
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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render(path.join(__dirname, 'datasets', 'streamedFile.txt'), {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer, 'Hello I am the streamed file!\n');
          assert.strictEqual(filename, 'tata.txt');
          assert.strictEqual(mock.pendingMocks().length, 0);
          done();
        });
      });

      it('should return an error if upload template return an error', (done) => {
        let mock = nock(CARBONE_URL)
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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render('templateId', {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer, 'Hello I am the streamed file!\n');
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

        sdk.render('templateId', {}, (err, buffer, filename) => {
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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          });

        sdk.render('templateId', {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer, 'https://render.carbone.io/render/renderId');
          assert.strictEqual(filename, 'renderId.pdf');
          done();
        });
      });

      it('should return an error if POST request fails two times', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .replyWithError('Request error');

        sdk.render('templateId', {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'Request error');
          done();
        });
      });

      it('should return an error if body is not a valid JSON object', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(200, 'Hello');

        sdk.render('templateId', {}, (err, buffer, filename) => {
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

        sdk.render('templateId', {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'Invalid templateId');
          done();
        });
      });

      it('should return response.statusMessage', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .reply(404);

        sdk.render('templateId', {}, (err, buffer, filename) => {
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

        sdk.render('templateId', {}, (err, buffer, filename) => {
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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .replyWithError('Request error');

        sdk.render('templateId', {}, (err, buffer, filename) => {
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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(404);

        sdk.render('templateId', {}, (err, buffer, filename) => {
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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(302);

        sdk.render('templateId', {}, (err, buffer, filename) => {
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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .replyWithError({ code: 'ECONNRESET' })
          .get((uri) => uri.includes('render'))
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.render('templateId', {}, (err, buffer, filename) => {
          assert.strictEqual(err, null);
          assert.strictEqual(buffer, 'Hello I am the streamed file!\n');
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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .replyWithError({ code: 'ECONNRESET' })
          .get((uri) => uri.includes('render'))
          .replyWithError({ code: 'ECONNRESET', message: 'No' });

        sdk.render('templateId', {}, (err, buffer, filename) => {
          assert.strictEqual(err.message, 'No');
          assert.strictEqual(mock.pendingMocks().length, 0);
          done();
        });
      });
    });

    describe('Stream', () => {
      let _filename = null;

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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render('templateId', {});

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
        let sdkStream = sdk.render('templateId', {});

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
        let sdkStream = sdk.render('templateId', {});

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
        let sdkStream = sdk.render('templateId', {});

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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .replyWithError('Request error');

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render('templateId', {});

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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(404);

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render('templateId', {});

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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(302);

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render('templateId', {});

        sdkStream.on('error', (err) => {
          assert.strictEqual(err.message, 'Error 302: an error occured');
          done();
        });

        sdkStream.pipe(writeStream);
      });

      it('should retry both requests once', (done) => {
        let mock = nock(CARBONE_URL)
          .post((uri) => uri.includes('render'))
          .replyWithError({ code: 'ECONNRESET' })
          .post((uri) => uri.includes('render'))
          .reply(200, {
            success: true,
            error: null,
            data: {
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .replyWithError({ code: 'ECONNRESET' })
          .get((uri) => uri.includes('render'))
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        let writeStream = fs.createWriteStream(path.join(__dirname, 'test.txt'));
        let sdkStream = sdk.render('templateId', {});

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
          done();
        });

        sdkStream.pipe(writeStream);
      });
    });
  });

  describe('Promise', () => {
    describe('Add template promise', () => {
      it('should add a template', (done) => {
        nock(CARBONE_URL)
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

      it('should return an error', (done) => {
        nock(CARBONE_URL)
          .post((uri) => uri.includes('template'))
          .replyWithError('Request error');

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
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          });

        sdk.getTemplatePromise('templateId').then((content) => {
          assert.strictEqual(content, 'Hello I am the streamed file!\n');
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
              renderId: 'renderId',
              inputFileExtension: 'pdf'
            }
          })
          .get((uri) => uri.includes('render'))
          .reply(200, (uri, requestBody) => {
            return fs.createReadStream(path.join(__dirname, 'datasets', 'streamedFile.txt'))
          }, {
            'Content-Disposition': 'filename="tata.txt"'
          });

        sdk.renderPromise(path.join(__dirname, 'datasets', 'test.odt'), {}).then((result) => {
          assert.strictEqual(result.content, 'Hello I am the streamed file!\n');
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

        sdk.renderPromise(path.join(__dirname, 'datasets', 'test.odt'), {}).then((result) => {
          assert.strictEqual(1, 2);
        })
        .catch((err) => {
          assert.strictEqual(err.message, 'Request error');
          done();
        });
      });
    });
  });
});
