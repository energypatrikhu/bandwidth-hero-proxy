import { Request, Response } from 'express';
import _ from 'lodash';
import superagent from 'superagent';
import compress from './compress.js';
import { convertFileSize, logger } from '@energypatrikhu/node-utils';

export default async function proxy(appRequest: Request, appResponse: Response) {
	const headers = {
		..._.pick(appRequest.headers, ['cookie', 'dnt', 'referer']),
		'accept-encoding': '*',
		'user-agent': 'Bandwidth-Hero Compressor',
		'x-forwarded-for': appRequest.headers['x-forwarded-for']?.toString()!,
		'via': '1.1 bandwidth-hero',
		'cache-control': 'private, no-cache, no-store, must-revalidate, max-age=0, proxy-revalidate, s-maxage=0',
		'pragma': 'no-cache',
		'expires': '0',
		'connection': 'close',
		'vary': '*',
	} satisfies Record<string, string>;

	try {
		if (appRequest.app.locals.url === undefined) {
			throw new Error('URL is not defined');
		}
		if (appRequest.app.locals.quality === undefined) {
			throw new Error('Quality is not defined');
		}

		const netResponse = await superagent
			.get(appRequest.app.locals.url)
			.set(headers)
			.withCredentials()
			.responseType('arraybuffer')
			.buffer(true);

		const mediaSize = netResponse.body.length;
		const compressedImage = await compress(netResponse.body, appRequest.app.locals);
		const savedSize = mediaSize - compressedImage.info.size;

		appResponse.writeHead(200, {
			...netResponse.headers,
			'content-encoding': 'identity',
			'content-type': `image/${appRequest.app.locals.format}`,
			'content-length': compressedImage.info.size,
			'x-original-size': mediaSize,
			'x-bytes-saved': savedSize,
			'connection': 'close',
		});

		appResponse.end(compressedImage.data, () => {
			logger(
				'info',
				JSON.stringify(
					{
						worker: process.pid,
						params: appRequest.app.locals,
						headers,
						body: {
							originalSize: convertFileSize(mediaSize),
							compressedSize: convertFileSize(compressedImage.info.size),
							savedSize: convertFileSize(savedSize),
						},
					},
					null,
					1,
				).replace(/\"/g, ''),
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
			JSON.stringify(
				{
					worker: process.pid,
					params: appRequest.app.locals,
					headers,
					body: {
						error: 'Cannot compress! ' + (reason.message ?? reason),
					},
				},
				null,
				1,
			).replace(/\"/g, ''),
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
