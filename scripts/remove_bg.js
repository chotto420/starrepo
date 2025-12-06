
const Jimp = require('jimp');
const path = require('path');

const PROCESS_FILES = [
    path.join(__dirname, '../src/app/icon.png'),
    path.join(__dirname, '../public/images/logo.png')
];

async function removeBackground() {
    for (const filePath of PROCESS_FILES) {
        try {
            console.log(`Processing: ${filePath}`);
            const image = await Jimp.read(filePath);

            // Get background color from top-left pixel
            const bgColor = image.getPixelColor(0, 0);
            const bgRGBA = Jimp.intToRGBA(bgColor);

            console.log(`Background color detected:`, bgRGBA);

            image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                const r = this.bitmap.data[idx + 0];
                const g = this.bitmap.data[idx + 1];
                const b = this.bitmap.data[idx + 2];

                // Calculate distance from background color
                const dist = Math.sqrt(
                    Math.pow(r - bgRGBA.r, 2) +
                    Math.pow(g - bgRGBA.g, 2) +
                    Math.pow(b - bgRGBA.b, 2)
                );

                // If distance is within tolerance, make it transparent
                // slightly higher tolerance to catch compression artifacts
                if (dist < 40) {
                    this.bitmap.data[idx + 3] = 0;
                }
            });

            await image.writeAsync(filePath);
            console.log(`Successfully processed: ${filePath}`);
        } catch (error) {
            console.error(`Error processing ${filePath}:`, error);
        }
    }
}

removeBackground();
