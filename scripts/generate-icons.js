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

        // Debug: Check if autocrop exists
        if (typeof source.autocrop !== 'function') {
            console.error('Error: source.autocrop is not a function.');
            console.log('Available methods on source:', Object.keys(Object.getPrototypeOf(source)));
            // Fallback: try autoCrop ?
            if (typeof source.autoCrop === 'function') {
                console.log('Found autoCrop instead of autocrop, using that.');
                source.autoCrop();
            } else {
                console.warn('Skipping autocrop (method not found). Icon borders will remain.');
            }
        } else {
            console.log('Autocropping to remove transparent padding...');
            try {
                source.autocrop();
                console.log(`Autocrop result: ${source.bitmap.width}x${source.bitmap.height}`);
            } catch (err) {
                console.error('Autocrop failed:', err);
            }
        }

        console.log('Generating standardized icons...');

        // Helper to save resized icon
        const save = async (w, h, name) => {
            console.log(`Starting ${name}...`);
            try {
                if (!source.clone) {
                    console.error('source.clone missing');
                    // Fallback for v1 if needed?
                }
                const img = source.clone();
                console.log(`Cloned ${name}`);

                if (!img.contain) {
                    console.error('img.contain missing');
                }
                img.contain({ w, h });
                console.log(`Contained ${name}`);

                const destPath = path.join(publicDir, name);
                console.log(`Writing to ${destPath}...`);
                await img.write(destPath);
                console.log(`Saved ${name} (${w}x${h})`);
            } catch (err) {
                console.log(`Error saving ${name}: ${err}`); // Use log instead of error to avoid inspect crash?
                throw new Error(`Failed to save ${name}: ${err}`);
            }
        };

        // Standard Icons
        await save(192, 192, 'icon-192.png');
        await save(512, 512, 'icon-512.png');

        // Also update the main 'icon.png' to be consistent
        await save(512, 512, 'icon.png');

        // Apple Touch Icon
        await save(180, 180, 'apple-touch-icon.png');

        // Maskable Icons (Same content, just enlarged via autocrop)
        // This relies on the "fill" strategy requested.
        await save(192, 192, 'icon-maskable-192.png');
        await save(512, 512, 'icon-maskable-512.png');

        // Favicon (small)
        // Warning: Jimp might not support .ico write. 
        // If it fails, we catch it.
        try {
            // Providing a png as favicon.ico often works in practice for modern browsers/servers
            // but jimp might complain about MIME type.
            // We will create favicon-32x32.png instead as it's safer standard.
            await save(32, 32, 'favicon-32x32.png');
            console.log('Saved favicon-32x32.png');

            // Copy to favicon.ico just in case (as a png)
            // If jimp fails on .ico extension, we skip.
            // await save(32, 32, 'favicon.ico'); 
        } catch (e) {
            console.warn('Skipping favicon.ico generation (Jimp limitation likely)');
        }

        console.log('Icon generation complete!');

    } catch (error) {
        console.log('Script failed!');
        console.log(error);
        process.exit(1);
    }
}

generate();
