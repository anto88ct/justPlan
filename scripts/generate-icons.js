const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const src = path.join(__dirname, '../src/assets/logo-mark.svg');
const outDir = path.join(__dirname, '../src/assets/icons');

fs.mkdirSync(outDir, { recursive: true });

const sizes = [192, 512];

Promise.all(
  sizes.map(size =>
    sharp(src)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `icon-${size}x${size}.png`))
  )
).then(() => {
  console.log('Icons generated:');
  sizes.forEach(s => console.log(`  src/assets/icons/icon-${s}x${s}.png`));
}).catch(err => {
  console.error('Icon generation failed:', err.message);
  process.exit(1);
});
