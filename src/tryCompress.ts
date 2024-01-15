import sharp, { OutputInfo } from 'sharp';

export function tryCompress(originalImageBuffer: Buffer, params: any, mediaSize: number) {
	return new Promise<{ buffer: Buffer; size: number; quality: number }>((resolve) => {
		sharp(originalImageBuffer, {
			animated: params.format === 'webp',
			limitInputPixels: false,
			failOn: 'none',
			unlimited: true,
		})
			.grayscale(params.grayscale as any)
			.toFormat(params.format as any, {
				quality: params.quality as any,
				effort: 6,
				mozjpeg: true,
				progressive: true,
				optimiseScans: true,
				optimiseCoding: true,
			})
			.toBuffer(async function (error: Error, buffer: Buffer, outputInfo: OutputInfo) {
				if (error) {
					buffer.set([]);
					buffer.fill(0);
					buffer = null;

					throw error ?? new Error('this should not happen');
				}

				// if (mediaSize - outputInfo.size < 0) {
				// 	buffer.set([]);
				// 	buffer.fill(0);
				// 	buffer = null;

				// 	return resolve(await tryCompress(originalImageBuffer, { ...params, quality: params.quality - 5 }, mediaSize));
				// }

				return resolve({ buffer: buffer, size: outputInfo.size!, quality: params.quality });
			});
	});
}
