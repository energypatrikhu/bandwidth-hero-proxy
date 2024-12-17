import { Request, Response } from 'express';
import superagent from 'superagent';
import { compressImage } from './compress-image.js';
import { convertFileSize, logger } from '@energypatrikhu/node-utils';
import { beautifyObject } from './beautify-object.js';
import { omitEquals } from './omit-equals.js';

export async function handleImageProxyRequest(appRequest: Request, appResponse: Response) {
	const filteredRequestHeaders = omitEquals(appRequest.headers, ['host']);
	const { url, format } = appRequest.app.locals;

	try {
		const externalImageResponse = await superagent
			.get(url)
			.set(filteredRequestHeaders)
			.timeout(60000)
			.retry(5)
			.redirects(10)
			.withCredentials()
			.responseType('arraybuffer')
			.buffer(true);

		appResponse.set(externalImageResponse.headers);

		const compressedImageResult = await compressImage(externalImageResponse.body, appRequest.app.locals);
		const compressedImageSize = compressedImageResult.info.size;
		const originalImageSize = externalImageResponse.body.length;
		const savedImageSize = originalImageSize - compressedImageSize;

		const compressedSizePercentage = (compressedImageSize / originalImageSize) * 100;
		const savedSizePercentage = 100 - compressedSizePercentage;

		if (savedImageSize > 0) {
			appResponse.set({
				'content-encoding': 'identity',
				'content-type': `image/${format}`,
				'content-length': compressedImageSize.toString(),
				'x-original-size': originalImageSize.toString(),
				'x-bytes-saved': savedImageSize.toString(),
			});
			appResponse.removeHeader('transfer-encoding');
			appResponse.send(compressedImageResult.data);
		} else {
			appResponse.send(externalImageResponse.body);
		}

		appResponse.on('finish', () => {
			logger(
				'info',
				beautifyObject({
					worker: process.pid,
					params: appRequest.app.locals,
					req_headers: filteredRequestHeaders,
					res_headers: appResponse.getHeaders(),
					body: {
						originalSize: convertFileSize(originalImageSize, 2),
						compressedSize: `${convertFileSize(compressedImageSize, 2)} (${compressedSizePercentage.toFixed(2)}%)`,
						savedSize: `${savedImageSize < 0 ? '-' : ''}${convertFileSize(
							Math.abs(savedImageSize),
							2,
						)} (${savedSizePercentage.toFixed(2)}%)`,
					},
				}),
			);

			if (global.gc) global.gc();
		});
	} catch (error: any) {
		logger(
			'error',
			beautifyObject({
				worker: process.pid,
				params: appRequest.app.locals,
				headers: filteredRequestHeaders,
				body: {
					error: 'Cannot compress!',
					reason: error.message ?? error,
				},
			}),
		);

		if (!appResponse.headersSent) {
			appResponse.redirect(url);
		}

		if (global.gc) global.gc();
	}
}
