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

        let filename = sdk.getTemplateFilename(obj);
        assert.strictEqual(filename, 'tata.txt');
      });

      it('should return null if object has no headers key', () => {
        let obj = {
        };

        let filename = sdk.getTemplateFilename(obj);
        assert.strictEqual(filename, null);
      });

      it('should return null if headers has no content-disposition key', () => {
        let obj = {
          headers: {}
        };

        let filename = sdk.getTemplateFilename(obj);
        assert.strictEqual(filename, null);
      });

      it('should return null if content-disposition is empty', () => {
        let obj = {
          headers: {
            'content-disposition': ''
          }
        };

        let filename = sdk.getTemplateFilename(obj);
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

      it('should return an error if the requets fails', (done) => {
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

      it('should return the filename is headers', (done) => {
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
          let filename = sdk.getTemplateFilename(fileStream)
          assert.strictEqual(filename, 'tata.txt');
          _filename = 'test.txt';
          done();
        });

        fileStream.pipe(writeStream);
      });
    });
  });
});
