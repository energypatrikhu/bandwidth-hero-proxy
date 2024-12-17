import { availableParallelism } from 'os';
import sharp from 'sharp';

export default function compress(imageBuffer: Buffer, locals: Express.Locals) {
	try {
		sharp.cache(false);
		sharp.simd(true);
		sharp.concurrency(availableParallelism());

		const sharpInstance = sharp(imageBuffer, {
			animated: locals.format === 'webp',
			limitInputPixels: false,
			failOn: 'none',
			unlimited: true,
		}).grayscale(locals.grayscale);

		switch (locals.format) {
			case 'webp':
				sharpInstance.webp({
					quality: locals.quality,
					effort: 6,
					lossless: false,
					force: true,
				});
				break;

			case 'jpeg':
				sharpInstance.jpeg({
					quality: locals.quality,
					optimiseCoding: true,
					mozjpeg: true,
					force: true,
				});
				break;
		}

		return sharpInstance.toBuffer({ resolveWithObject: true });
	} catch (error) {
		throw error ?? new Error('This should not happen');
	}
}
