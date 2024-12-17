import { Request, Response } from 'express';
import superagent from 'superagent';
import compress from './compress.js';
import { convertFileSize, logger } from '@energypatrikhu/node-utils';
import { beautifyObject } from './beautify-object.js';
import { omitEquals } from './omit.js';

export default async function proxy(appRequest: Request, appResponse: Response) {
	const headers = omitEquals(appRequest.headers, ['host']);

	if (appRequest.app.locals.url === undefined) {
		logger('error', 'URL is not defined');
		appResponse.status(400).send('URL is not defined');
		return;
	}

	if (appRequest.app.locals.quality === undefined) {
		logger('error', 'Quality is not defined');
		appResponse.status(400).send('Quality is not defined');
		return;
	}

	try {
		const netResponse = await superagent
			.get(appRequest.app.locals.url)
			.set(headers)
			.timeout(60000)
			.retry(3)
			.withCredentials()
			.responseType('arraybuffer')
			.buffer(true);

		appResponse.set(netResponse.headers);

		const compressedImage = await compress(netResponse.body, appRequest.app.locals);
		const compressedSize = compressedImage.info.size;
		const mediaSize = netResponse.body.length;
		const savedSize = mediaSize - compressedSize;

		const compressedSizePercentage = (compressedSize / mediaSize) * 100;
		const savedSizePercentage = 100 - compressedSizePercentage;

		if (savedSize > 0) {
			appResponse.set({
				'content-encoding': 'identity',
				'content-type': `image/${appRequest.app.locals.format}`,
				'content-length': compressedSize.toString(),
				'x-original-size': mediaSize.toString(),
				'x-bytes-saved': savedSize.toString(),
			});
			appResponse.removeHeader('transfer-encoding');
			appResponse.send(compressedImage.data);
		} else {
			appResponse.send(netResponse.body);
		}

		appResponse.on('finish', () => {
			logger(
				'info',
				'\n' +
					beautifyObject({
						worker: process.pid,
						params: appRequest.app.locals,
						req_headers: headers,
						res_headers: appResponse.getHeaders(),
						body: {
							originalSize: convertFileSize(mediaSize, 2),
							compressedSize: convertFileSize(compressedSize, 2) + ` (${compressedSizePercentage.toFixed(2)}%)`,
							savedSize:
								(savedSize < 0 ? '-' : '') + convertFileSize(Math.abs(savedSize), 2) + ` (${savedSizePercentage.toFixed(2)}%)`,
						},
					}),
			);

			if (gc) gc();
			else if (global.gc) global.gc();
		});
	} catch (reason: any) {
		logger(
			'error',
			'\n' +
				beautifyObject({
					worker: process.pid,
					params: appRequest.app.locals,
					headers,
					body: {
						error: 'Cannot compress!',
						reason: reason.message ?? reason,
					},
				}),
		);

		if (appResponse.headersSent) {
			if (gc) gc();
			else if (global.gc) global.gc();
			return;
		}

		appResponse.redirect(appRequest.app.locals.url);

		if (gc) gc();
		else if (global.gc) global.gc();
	}
}
