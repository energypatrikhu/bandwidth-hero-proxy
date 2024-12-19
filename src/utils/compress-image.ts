import sharp from 'sharp';

export async function compressImage(imageBuffer: Buffer, compressionOptions: Express.Locals) {
	try {
		const imageProcessor = sharp(imageBuffer, {
			animated: compressionOptions.format === 'webp',
			limitInputPixels: false,
			failOn: 'none',
			unlimited: true,
		}).grayscale(compressionOptions.grayscale);

		const formatSpecificOptions = {
			webp: { quality: compressionOptions.quality, effort: 6, lossless: false, force: true },
			jpeg: { quality: compressionOptions.quality, optimiseCoding: true, mozjpeg: true, force: true },
		};

		if (compressionOptions.format in formatSpecificOptions) {
			imageProcessor[compressionOptions.format](formatSpecificOptions[compressionOptions.format]);
		}

		return {
			format: compressionOptions.format,
			image: await imageProcessor.toBuffer({ resolveWithObject: true }),
		};
	} catch (error) {
		throw error ?? new Error('Unexpected error occurred during image compression');
	}
}
