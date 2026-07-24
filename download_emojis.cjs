const https = require('https');
const fs = require('fs');
const path = require('path');

const icons = {
  Droplets: 'Droplet',
  Wind: 'Dashing away',
  Target: 'Bullseye',
  Activity: 'Beating heart',
  Hammer: 'Hammer'
};

const outputDir = path.join(__dirname, 'public', '3d-icons');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function run() {
  for (const [key, name] of Object.entries(icons)) {
    const formatName = name.toLowerCase().replace(/ /g, '_');
    const urlFormat1 = `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/${encodeURIComponent(name)}/3D/${formatName}_3d.png`;
    const urlFormat2 = `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/${encodeURIComponent(name)}/Default/3D/${formatName}_3d_default.png`;
    
    const dest = path.join(outputDir, `${key}.png`);
    
    try {
      await downloadFile(urlFormat1, dest);
      console.log(`Downloaded ${key} (Format 1)`);
    } catch (e1) {
      try {
        await downloadFile(urlFormat2, dest);
        console.log(`Downloaded ${key} (Format 2)`);
      } catch (e2) {
        console.log(`Failed to download ${key}:`, e1.message, e2.message);
      }
    }
  }
}

run();
