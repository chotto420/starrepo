
const fs = require('fs');
const { PNG } = require('pngjs');
const path = require('path');

const PROCESS_FILES = [
    path.join(__dirname, '../src/app/icon.png'),
    path.join(__dirname, '../public/images/logo.png')
];

async function processFile(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${filePath}`);
            return resolve();
        }

        console.log(`Processing: ${filePath}`);

        // Read file into buffer first to avoid issues with reading/writing same file
        const buffer = fs.readFileSync(filePath);

        new PNG().parse(buffer, function (error, data) {
            if (error) {
                console.error(`Error parsing ${filePath}:`, error);
                return reject(error);
            }

            // Get background color from top-left pixel (0,0)
            const bgR = this.data[0];
            const bgG = this.data[1];
            const bgB = this.data[2];

            console.log(`Background color detected: R=${bgR}, G=${bgG}, B=${bgB}`);

            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const idx = (this.width * y + x) << 2;

                    const r = this.data[idx];
                    const g = this.data[idx + 1];
                    const b = this.data[idx + 2];

                    // Euclidean distance
                    const dist = Math.sqrt(
                        Math.pow(r - bgR, 2) +
                        Math.pow(g - bgG, 2) +
                        Math.pow(b - bgB, 2)
                    );

                    // If pixel is similar to background, make it transparent
                    if (dist < 40) {
                        this.data[idx + 3] = 0;
                    }
                }
            }

            const writeStream = fs.createWriteStream(filePath);
            this.pack().pipe(writeStream)
                .on('finish', () => {
                    console.log(`Successfully processed and saved: ${filePath}`);
                    resolve();
                })
                .on('error', reject);
        });
    });
}

(async () => {
    for (const file of PROCESS_FILES) {
        try {
            await processFile(file);
        } catch (e) {
            console.error(e);
        }
    }
})();
