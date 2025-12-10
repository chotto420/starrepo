const Jimp = require('jimp');

console.log('Type:', typeof Jimp);
console.log('Keys:', Object.keys(Jimp));
if (Jimp.default) {
    console.log('Default Type:', typeof Jimp.default);
    console.log('Default Keys:', Object.keys(Jimp.default));
}
