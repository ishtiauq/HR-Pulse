const { Jimp } = require('jimp');
const path = require('path');

const files = [
  'faq-illustration.jpg'
];

async function processImage(file) {
  try {
    const image = await Jimp.read(path.join('src', 'Assets', file));
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    // Find the background color (usually white)
    image.scan(0, 0, w, h, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // If it's very close to white, make it transparent
      if (red > 240 && green > 240 && blue > 240) {
        this.bitmap.data[idx + 3] = 0; // Alpha to 0
      }
    });

    const outName = file.replace('.jpg', '.png');
    await image.write(path.join('src', 'Assets', outName));
    console.log(`Processed ${file} -> ${outName}`);
  } catch (err) {
    console.error(`Error with ${file}:`, err);
  }
}

async function main() {
  for (const file of files) {
    await processImage(file);
  }
}

main();
