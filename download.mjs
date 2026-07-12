import https from 'https';
import fs from 'fs';

// This is a reliable Wikimedia Commons video (abstract network/tech visualization).
const url = "https://upload.wikimedia.org/wikipedia/commons/transcoded/1/1c/Network_simulation.webm/Network_simulation.webm.720p.webm";

const file = fs.createWriteStream("frontend/public/background.mp4");

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
}, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log("Download complete.");
  });
}).on('error', (err) => {
  fs.unlink("frontend/public/background.mp4", () => {});
  console.error("Error downloading:", err.message);
});
