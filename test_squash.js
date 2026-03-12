const jpeg = require('@jsquash/jpeg');
const png = require('@jsquash/png');
const webp = require('@jsquash/webp');
const avif = require('@jsquash/avif');
console.log('JPEG:', Object.keys(jpeg));
console.log('PNG:', Object.keys(png));
console.log('WEBP:', Object.keys(webp));
console.log('AVIF:', Object.keys(avif));
