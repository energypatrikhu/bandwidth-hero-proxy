import { Request, Response } from 'express';
import superagent from 'superagent';
import compress from './compress.js';
import { convertFileSize, logger } from '@energypatrikhu/node-utils';
import { beautifyObject } from './beautify-object.js';
import { omitStartWith } from './omit.js';

export default async function proxy(appRequest: Request, appResponse: Response) {
	const headers = {
		...omitStartWith(appRequest.headers, ['host']),
		via: '1.1 bandwidth-hero',
	};

	try {
		if (appRequest.app.locals.url === undefined) {
			logger('error', 'URL is not defined');
			return;
		}
		if (appRequest.app.locals.quality === undefined) {
			logger('error', 'Quality is not defined');
			return;
		}

		const netResponse = await superagent
			.get(appRequest.app.locals.url)
			.set(headers)
			.timeout({
				response: 30000,
				deadline: 60000,
			})
			.retry(3)
			.withCredentials()
			.responseType('arraybuffer')
			.buffer(true);

		const mediaSize = netResponse.body.length;
		const compressedImage = await compress(netResponse.body, appRequest.app.locals);
		const compressedSize = compressedImage.info.size;
		const savedSize = mediaSize - compressedSize;

		const compressedSizePercentage = (compressedSize / mediaSize) * 100;
		const savedSizePercentage = 100 - compressedSizePercentage;

		appResponse.writeHead(200, {
			...netResponse.headers,
			'content-encoding': 'identity',
			'content-type': `image/${appRequest.app.locals.format}`,
			'content-length': compressedSize,
			'x-original-size': mediaSize,
			'x-bytes-saved': savedSize,
		});

		appResponse.write(compressedImage.data);

		appResponse.end(() => {
			logger(
				'info',
				'\n' +
					beautifyObject({
						worker: process.pid,
						params: appRequest.app.locals,
						headers,
						body: {
							originalSize: convertFileSize(mediaSize, 2),
							compressedSize: convertFileSize(compressedSize, 2) + ` (${compressedSizePercentage.toFixed(2)}%)`,
							savedSize: convertFileSize(savedSize, 2) + ` (${savedSizePercentage.toFixed(2)}%)`,
						},
					}),
			);

			appResponse.flushHeaders();
			appResponse.destroy();
			appRequest.drop(Infinity);
			appRequest.destroy();

			netResponse.body.set([]);
			netResponse.body.fill(0);
			netResponse.body = Buffer.alloc(0);
			compressedImage.data.set([]);
			compressedImage.data.fill(0);
			compressedImage.data = Buffer.alloc(0);

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

		appResponse
			.writeHead(302, {
				'Content-Length': '0',
				'Location': encodeURI(appRequest.app.locals.url),
			})
			.end(() => {
				appResponse.flushHeaders();
				appResponse.destroy();
				appRequest.drop(Infinity);
				appRequest.destroy();

				if (gc) gc();
				else if (global.gc) global.gc();
			});

		if (gc) gc();
		else if (global.gc) global.gc();
	}
}
