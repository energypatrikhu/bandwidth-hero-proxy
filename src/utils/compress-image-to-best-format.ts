import { compressImage } from './compress-image';

export function compressImageToBestFormat(imageBuffer: Buffer, compressionOptions: Express.Locals) {
	return Promise.all([
		compressImage(imageBuffer, { ...compressionOptions, format: 'webp' }),
		compressImage(imageBuffer, { ...compressionOptions, format: 'jpeg' }),
	]);
}
