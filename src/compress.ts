import { availableParallelism } from 'node:os';
import sharp from 'sharp';

export default async function compress(
	originalImageBuffer: Buffer,
	params: any,
) {
	try {
		const { format, grayscale, quality } = params;

		sharp.cache(false);
		sharp.simd(true);
		sharp.concurrency(availableParallelism());

		return await sharp(originalImageBuffer, {
			animated: format === 'webp',
			limitInputPixels: false,
			failOn: 'none',
			unlimited: true,
		})
			.grayscale(grayscale as any)
			.toFormat(format as any, {
				quality: quality as any,
				effort: 6,
				mozjpeg: true,
				progressive: true,
				optimiseScans: true,
				optimiseCoding: true,
				force: true,
			})
			.toBuffer({ resolveWithObject: true });
	} catch (error) {
		throw error ?? new Error('This should not happen');
	}
}
