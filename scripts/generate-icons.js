const path = require('path');
const fs = require('fs');
const _JimpLib = require('jimp');
const Jimp = _JimpLib.Jimp || _JimpLib;

async function generate() {
    try {
        const publicDir = path.join(process.cwd(), 'public');
        // Prefer icon-512.png as source, fallback to icon.png
        let sourcePath = path.join(publicDir, 'icon-512.png');
        if (!fs.existsSync(sourcePath)) {
            sourcePath = path.join(publicDir, 'icon.png');
        }

        console.log(`Reading source from ${sourcePath}...`);

        if (typeof Jimp.read !== 'function') {
            throw new Error(`Jimp.read is not a function. It is: ${typeof Jimp.read}`);
        }

        const source = await Jimp.read(sourcePath);
        console.log('Source image loaded.');

        // Autocrop with higher tolerance, using object syntax
        console.log('Autocropping to remove transparent padding...');
        try {
            if (source.autocrop) {
                source.autocrop({ tolerance: 0.05 });
            }
            console.log(`Autocrop result: ${source.bitmap.width}x${source.bitmap.height}`);
        } catch (err) {
            console.error('Autocrop failed:', err);
        }

        console.log('Generating standardized icons...');

        // Helper to save resized icon
        const save = async (w, h, name, addBackground = false) => {
            console.log(`Starting ${name}...`);
            try {
                let img = source.clone();

                if (addBackground) {
                    // Create background by resizing clone and filling with #0a0214FF
                    // Use object argument for resize: { w, h }
                    const bg = source.clone().resize({ w: w, h: h });

                    // Manually fill buffer
                    bg.scan(0, 0, w, h, function (x, y, idx) {
                        this.bitmap.data.writeUInt32BE(0x0a0214FF, idx);
                    });

                    // Contain the icon within the background
                    img.contain({ w, h });

                    // Composite icon onto background
                    bg.composite(img, 0, 0);
                    img = bg;
                } else {
                    img.contain({ w, h });
                }

                const destPath = path.join(publicDir, name);
                await img.write(destPath);
                console.log(`Saved ${name} (${w}x${h})`);
            } catch (err) {
                console.log(`Error saving ${name}: ${err}`);
                throw new Error(`Failed to save ${name}: ${err}`);
            }
        };

        // Standard Icons (Transparent)
        await save(192, 192, 'icon-192.png', false);
        await save(512, 512, 'icon-512.png', false);
        await save(512, 512, 'icon.png', false);
        await save(180, 180, 'apple-touch-icon.png', false);

        // Maskable Icons (With dark background)
        await save(192, 192, 'icon-maskable-192.png', true);
        await save(512, 512, 'icon-maskable-512.png', true);

        // Favicon
        try {
            await save(32, 32, 'favicon-32x32.png', false);
        } catch (e) {
            console.warn('Skipping favicon generation');
        }

        console.log('Icon generation complete!');

    } catch (error) {
        console.log('Script failed!');
        console.log(error);
        process.exit(1);
    }
}

generate();
