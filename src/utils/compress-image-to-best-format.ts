import { convertFileSize } from '@energypatrikhu/node-utils';
import { compressImage } from './compress-image';

export async function compressImageToBestFormat(imageBuffer: Buffer, compressionOptions: Express.Locals) {
	const compressedImageResults = await Promise.all([
		compressImage(imageBuffer, { ...compressionOptions, format: 'webp' }),
		compressImage(imageBuffer, { ...compressionOptions, format: 'jpeg' }),
	]);

	const result = compressedImageResults.sort((a, b) => a.image.info.size - b.image.info.size)[0];
	const webpSize = compressedImageResults.find((result) => result.format === 'webp')?.image.info.size!;
	const jpegSize = compressedImageResults.find((result) => result.format === 'jpeg')?.image.info.size!;

	return {
		...result,
		sizes: {
			webp: convertFileSize(webpSize, 2) + (result.format === 'webp' ? ' (best)' : ''),
			jpeg: convertFileSize(jpegSize, 2) + (result.format === 'jpeg' ? ' (best)' : ''),
		},
	};
}
