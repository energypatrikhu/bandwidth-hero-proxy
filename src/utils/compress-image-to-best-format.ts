import { convertFileSize } from '@energypatrikhu/node-utils';
import { compressImage } from './compress-image';

export async function compressImageToBestFormat(imageBuffer: Buffer, compressionOptions: Express.Locals) {
	const compressedImageResults = await Promise.all([
		compressImage(imageBuffer, { ...compressionOptions, format: 'webp' }),
		compressImage(imageBuffer, { ...compressionOptions, format: 'jpeg' }),
	]);

	const result = compressedImageResults.sort((a, b) => a.image.info.size - b.image.info.size)[0];

	return {
		...result,
		sizes: {
			webp: convertFileSize(compressedImageResults[0].image.info.size, 2) + (result.format === 'webp' ? ' (best)' : ''),
			jpeg: convertFileSize(compressedImageResults[1].image.info.size, 2) + (result.format === 'jpeg' ? ' (best)' : ''),
		},
	};
}
