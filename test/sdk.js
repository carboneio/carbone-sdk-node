const assert = require('assert');
const path = require('path');
const sdk = require('../index')('eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI1NSIsImF1ZCI6ImNhcmJvbmUiLCJleHAiOjIyMDQ0NjkwMjcsImRhdGEiOnsiaWRBY2NvdW50Ijo1NX19.AC4vwhPF3FBBmxywXnpJNvapUssq3N9D7FpYJFMe8brp-Sm_ZMVpccCk0cEXhOIn59lnAzwCsUzGkWmzT0cFduQ6ALtPOoQzcSE-eBdA30EdgnGmQnT7LkrQPCy62wjdRXaT3JZUigUxLEcCZL8E4UHoIxUc4WW10X5Y-DJFLlS-ilNi');

describe('Carbone SDK', () => {
  describe('Add template', () => {
    it('should add a template', (done) => {
      sdk.addTemplate(path.join(__dirname, 'datasets', 'test.odt'), 'toto', (err, body) => {
        console.log(err, body)
        done()
      })
    });
  });
});
