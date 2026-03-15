const https = require('https');
const fs = require('fs');

const url = 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Namma_Metro_map.svg';
const file = fs.createWriteStream('./client/public/namma-metro-map.svg');

https.get(url, response => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download Completed');
  });
}).on('error', err => {
  fs.unlink('./client/public/namma-metro-map.svg');
  console.error('Error: ', err.message);
});
