import { availableParallelism } from 'os';
import sharp from 'sharp';

export default async function compress(originalImageBuffer: Buffer, params: any) {
	try {
		const { format, grayscale, quality } = params;

		sharp.cache(false);
		sharp.simd(true);
		sharp.concurrency(availableParallelism());

		const sharpInstance = sharp(originalImageBuffer, {
			animated: format === 'webp',
			limitInputPixels: false,
			failOn: 'none',
			unlimited: true,
		}).grayscale(grayscale as any);

		switch (format) {
			case 'webp':
				sharpInstance.webp({
					quality: quality as any,
					effort: 6,
					lossless: false,
					force: true,
				});
				break;

			case 'jpeg':
				sharpInstance.jpeg({
					quality: quality as any,
					optimiseCoding: true,
					mozjpeg: true,
					force: true,
				});
				break;
		}

		return await sharpInstance.toBuffer({ resolveWithObject: true });
	} catch (error) {
		throw error ?? new Error('This should not happen');
	}
}
