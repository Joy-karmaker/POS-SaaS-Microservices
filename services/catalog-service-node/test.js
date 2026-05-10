const crypto = require('crypto');
const secret = 'local-dev-jwt-secret-change-this';
const data = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwicm9sZSI6InRlbmFudF9hZG1pbiIsInRlbmFudF9pZCI6MSwic3RvcmVfaWQiOm51bGwsImp0aSI6ImExNWRjZWY2LThmZjEtNGE0NC1iMDdjLTJhZjY2OTkxNjBjZCIsImlhdCI6MTc3ODM1MjExOSwiZXhwIjoxNzc4MzU1NzE5LCJpc3MiOiJwb3MtYXV0aCIsImF1ZCI6InBvcy1jbGllbnRzIn0';
const sig = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
console.log('Expected:', sig);
console.log('Actual:  ', 'gdBAZp4y2loaDceZxOhqrDTCxqbuvUaS8CJSVQnCeEU');
