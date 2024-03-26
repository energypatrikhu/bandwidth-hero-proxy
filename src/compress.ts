import sharp from 'sharp';

export const compress = async (originalImageBuffer: Buffer, params: any) => {
	try {
		const { format, grayscale, quality } = params;

		const outputInfo = await sharp(originalImageBuffer, {
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
			})
			.toBuffer();

		return { buffer: outputInfo, size: outputInfo.length!, quality };
	} catch (error) {
		throw error ?? new Error('This should not happen');
	}
};
