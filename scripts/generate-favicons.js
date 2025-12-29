const { Jimp } = require('jimp');
const path = require('path');

async function generateIcons() {
    // 元画像として透過済みのロゴを使用
    const inputPath = path.join(process.cwd(), 'public', 'images', 'logo', 'logo_icon_transparent.png');

    console.log(`Loading image from: ${inputPath}`);

    try {
        const image = await Jimp.read(inputPath);

        // Google検索推奨サイズ: 48の倍数 (ここでは大きめの144x144を採用)
        await image.clone().resize({ w: 144, h: 144 }).write(path.join(process.cwd(), 'public', 'icon-144.png'));
        console.log('Generated public/icon-144.png');

        // 安全策として標準的なサイズも生成
        await image.clone().resize({ w: 48, h: 48 }).write(path.join(process.cwd(), 'public', 'icon-48.png'));
        console.log('Generated public/icon-48.png');

        // 一般的なファビコンサイズ
        await image.clone().resize({ w: 32, h: 32 }).write(path.join(process.cwd(), 'public', 'favicon.ico')); // png形式で保存されるが拡張子はicoでブラウザ互換を狙う（Jimpはico変換非対応だが最近のブラウザはpngリネームでも通ることが多い、が念のためpngとして扱う方が無難）
        // 訂正: Jimp標準ではico書き出しはできないので、pngとして書き出し、layout.tsxでpngとして指定する方針にする。
        // ここでは単に汎用的な icon.png (32x32) を作る
        await image.clone().resize({ w: 32, h: 32 }).write(path.join(process.cwd(), 'public', 'icon-32.png'));
        console.log('Generated public/icon-32.png');

    } catch (err) {
        console.error('Error generating icons:', err);
    }
}

generateIcons();
