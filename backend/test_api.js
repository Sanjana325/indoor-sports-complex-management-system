const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/classes',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
    // Skipping Authorization for this test assuming local dev might not have strict JWT checks OR I'll see a 401/403
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('BODY:', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
  process.exit(1);
});

req.end();
