#!/usr/bin/env node
const https = require('https');

function fetchFirstFunding() {
  return new Promise((resolve, reject) => {
    const req = https.get('https://svtr.ai/api/wiki-funding-sync', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success && json.data && json.data.length > 0) {
            console.log(JSON.stringify(json.data[0], null, 2));
          } else {
            console.error('No data found');
          }
          resolve();
        } catch (error) {
          console.error('JSON parse error:', error);
          reject(error);
        }
      });
    });

    req.on('error', reject);
  });
}

fetchFirstFunding().catch(console.error);