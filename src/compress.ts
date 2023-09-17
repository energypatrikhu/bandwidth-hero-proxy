import axios, { AxiosResponse } from 'axios';
import { IncomingMessage, ServerResponse } from 'http';
import _ from 'lodash';
import sharp, { OutputInfo } from 'sharp';

import convertFileSize from './convertFileSize.js';
import copyHeaders from './copyHeaders.js';
import getCurrentTime from './getCurrentTime.js';
import paramsParser from './paramsParser.js';
import redirect from './redirect.js';

export default async function proxyBuffer(request: IncomingMessage, response: ServerResponse<IncomingMessage>) {
	let params = paramsParser(request);
	if (typeof params === 'string') {
		response.write(params);
		response.end();
		response.flushHeaders();
		response.destroy();
		request.drop(Infinity);
		request.destroy();

		if (gc) gc();
		else if (global.gc) global.gc();

		return;
	}

	try {
		let headers = {
			..._.pick(request.headers, ['cookie', 'dnt', 'referer']),
			'accept-encoding': '*',
			'user-agent': 'Bandwidth-Hero Compressor',
			'x-forwarded-for': request.headers['x-forwarded-for']?.toString()!,
			'via': '1.1 bandwidth-hero',
		};

		let netResponse: AxiosResponse | null = await axios({
			method: 'get',
			headers,
			url: params.url,
			responseType: 'arraybuffer',
		});

		if (!netResponse) throw new Error('no response (1)');

		let mediaSize = netResponse.data.length;

		sharp(netResponse.data, {
			animated: params.format === 'webp',
			limitInputPixels: false,
			failOn: 'none',
			unlimited: true,
		})
			.grayscale(params.grayscale)
			.toFormat(params.format, {
				quality: params.quality,
				effort: 6,
				mozjpeg: true,
				progressive: true,
				optimiseScans: true,
				optimiseCoding: true,
			})
			.toBuffer(function (err: Error, buffer: Buffer, info: OutputInfo) {
				if (err || !netResponse || typeof params === 'string') {
					response.write(params);
					response.end();
					response.flushHeaders();
					response.destroy();
					request.drop(Infinity);
					request.destroy();

					netResponse?.data.set([]);
					netResponse?.data.fill(0);
					buffer.set([]);
					buffer.fill(0);

					netResponse!.data = null;

					if (gc) gc();
					else if (global.gc) global.gc();

					throw err ?? new Error('this should not happen');
				}

				let savedSize = mediaSize - info.size;

				console.log(' ');
				console.log(
					getCurrentTime(),
					JSON.stringify(
						{
							params,
							headers,
							body: {
								originalSize: convertFileSize(mediaSize),
								compressedSize: convertFileSize(info.size),
								savedSize: savedSize < 0 ? `-${convertFileSize(Math.abs(savedSize))}` : convertFileSize(savedSize),
							},
						},
						null,
						1,
					).replace(/\"/g, ''),
				);

				if (savedSize < 0) {
					netResponse?.data.set([]);
					netResponse?.data.fill(0);
					buffer.set([]);
					buffer.fill(0);

					netResponse!.data = null;

					if (gc) gc();
					else if (global.gc) global.gc();

					return redirect(request, response, params);
				}

				copyHeaders(netResponse, response);
				response.setHeader('content-encoding', 'identity');
				response.setHeader('content-type', `image/${params.format}`);
				response.setHeader('content-length', info.size);
				response.setHeader('x-original-size', mediaSize);
				response.setHeader('x-bytes-saved', savedSize);
				response.statusCode = 200;
				response.write(buffer);
				response.end().on('close', function () {
					response.flushHeaders();
					response.destroy();
					request.drop(Infinity);
					request.destroy();

					netResponse?.data.set([]);
					netResponse?.data.fill(0);
					buffer.set([]);
					buffer.fill(0);

					netResponse!.data = null;

					if (gc) gc();
					else if (global.gc) global.gc();
				});
			});
	} catch (error: any) {
		console.error('[proxy]', 'Cannot compress,', error.message ?? error);

		return redirect(request, response, params);
	} finally {
		if (gc) gc();
		else if (global.gc) global.gc();
	}
}
