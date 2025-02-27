// Script to generate extension icons
const fs = require('fs');
const { createCanvas } = require('canvas');

// Icon sizes needed
const sizes = [16, 48, 128];

// Create icons directory if it doesn't exist
if (!fs.existsSync('./icons')) {
  fs.mkdirSync('./icons');
}

// Generate icons for each size
sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = '#2196F3';
  ctx.fillRect(0, 0, size, size);

  // Draw "PE" text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PE', size / 2, size / 2);

  // Save the icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`./icons/icon${size}.png`, buffer);
});

console.log('Icons generated successfully!');