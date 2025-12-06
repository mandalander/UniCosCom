const path = require('path');
const _JimpLib = require('jimp');
const Jimp = _JimpLib.Jimp || _JimpLib;

async function probe() {
    try {
        const publicDir = path.join(process.cwd(), 'public');
        const sourcePath = path.join(publicDir, 'icon-512.png');
        console.log(`Reading source from ${sourcePath}...`);
        const source = await Jimp.read(sourcePath);

        const hex = source.getPixelColor(0, 0); // Top-left corner
        console.log(`Pixel (0,0) Color: HEX 0x${hex.toString(16).toUpperCase()}`);

    } catch (error) {
        console.error('Error probing:', error);
    }
}

probe();
