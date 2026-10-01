const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(process.cwd(), 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

// 1024x1024 for standard Icon
// The svg needs to be scaled up. viewBox="0 0 32 32" means we can scale uniformly.
const svgIcon = `<svg width="1024" height="1024" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="clipad-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#00beac" stopOpacity="1" />
      <stop offset="100%" stopColor="#006065" stopOpacity="1" />
    </linearGradient>
  </defs>
  <path d="M26 12 C26 5, 20 2, 16 2 C8 2, 2 8, 2 16 C2 24, 8 30, 16 30 C22 30, 26 26, 26 26" stroke="url(#clipad-grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  <path d="M12 10 L22 16 L12 22 Z" fill="url(#clipad-grad)" />
  <circle cx="26" cy="6" r="3" fill="#fad503" />
</svg>`;

// 2732x2732 for Splash
// We center a smaller icon inside the huge canvas
// Let's place the 32x32 icon in the middle by setting viewBox and width/height.
// To make it look nice, we'll draw it scaled in the center.
const svgSplash = `<svg width="2732" height="2732" viewBox="0 0 2732 2732" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="clipad-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#00beac" stopOpacity="1" />
      <stop offset="100%" stopColor="#006065" stopOpacity="1" />
    </linearGradient>
  </defs>
  
  <g transform="translate(1026, 1026) scale(21.25)">
    <path d="M26 12 C26 5, 20 2, 16 2 C8 2, 2 8, 2 16 C2 24, 8 30, 16 30 C22 30, 26 26, 26 26" stroke="url(#clipad-grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 10 L22 16 L12 22 Z" fill="url(#clipad-grad)" />
    <circle cx="26" cy="6" r="3" fill="#fad503" />
  </g>
</svg>`;

async function generate() {
  await sharp(Buffer.from(svgIcon))
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
    
  await sharp(Buffer.from(svgSplash))
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));
    
  console.log('PNGs generated successfully in assets/ folder.');
}

generate().catch(console.error);
