const fs = require('fs');
const https = require('https');
const path = require('path');

const images = [
  {
    url: 'https://image.tmdb.org/t/p/w500/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg',
    filename: 'moana2.jpg',
  },
  {
    url: 'https://image.tmdb.org/t/p/w500/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg',
    filename: 'thelastofus.jpg',
  },
  {
    url: 'https://image.tmdb.org/t/p/w500/7PYqz0viEuW8qTvuGinUMjDWMnj.jpg',
    filename: 'sandlot.jpg',
  },
];

const destDir = path.join(__dirname, '../public/demo');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

(async () => {
  for (const img of images) {
    const dest = path.join(destDir, img.filename);
    try {
      await downloadImage(img.url, dest);
      console.log(`Downloaded ${img.filename}`);
    } catch (err) {
      console.error(`Failed to download ${img.filename}:`, err.message);
    }
  }
})(); 