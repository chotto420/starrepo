const { Jimp } = require('jimp');
const path = require('path');

async function removeWhiteBackground() {
    const inputPath = path.join(process.cwd(), 'public/images/creators/pixel_members.png');
    const outputPath = path.join(process.cwd(), 'public/images/creators/pixel_members_transparent.png');

    try {
        console.log('Reading image from:', inputPath);
        const image = await Jimp.read(inputPath);

        console.log('Image read successfully. processing...');

        // Scan each pixel
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];

            // Define threshold for "white"
            // Since it's pixel art, white is likely pure white (255,255,255)
            // But let's be slightly lenient e.g. > 240
            if (red >= 240 && green >= 240 && blue >= 240) {
                this.bitmap.data[idx + 3] = 0; // Set alpha to 0 (fully transparent)
            }
        });

        // await image.writeAsync(outputPath);
        await new Promise((resolve, reject) => {
            image.write(outputPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('Successfully created transparent image at:', outputPath);
    } catch (error) {
        console.error('Error processing image:', error);
        process.exit(1);
    }
}

removeWhiteBackground();
