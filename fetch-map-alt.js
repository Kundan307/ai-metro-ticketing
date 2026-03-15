const https = require('https');
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/ShashankS123/Bangalore-Map/main/Map.svg';
const file = fs.createWriteStream('./client/public/namma-metro-map.svg');

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, response => {
  if (response.statusCode === 200) {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Download Completed Successfully');
    });
  } else {
    console.error('Failed to download: ', response.statusCode);
  }
}).on('error', err => {
  console.error('Error: ', err.message);
});
