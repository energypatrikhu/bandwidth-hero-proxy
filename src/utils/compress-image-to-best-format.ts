import { logger } from '@energypatrikhu/node-utils';
import { compressImage } from './compress-image';

export async function compressImageToBestFormat(imageBuffer: Buffer, compressionOptions: Express.Locals) {
	const compressedImageResults = await Promise.all([
		compressImage(imageBuffer, { ...compressionOptions, format: 'webp' }),
		compressImage(imageBuffer, { ...compressionOptions, format: 'jpeg' }),
	]);

	const webpSize = compressedImageResults[0].image.info.size;
	const jpegSize = compressedImageResults[1].image.info.size;

	logger('info', `Compressed webp size: ${webpSize} bytes, jpeg size: ${jpegSize} bytes`);

	return compressedImageResults.sort((a, b) => a.image.info.size - b.image.info.size)[0];
}