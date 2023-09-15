import { AxiosResponse } from 'axios';
import { Request, Response } from 'express';
import _ from 'lodash';
import sharp, { FormatEnum, Metadata, OutputInfo } from 'sharp';

import copyHeaders from './copyHeaders.js';
import net from './net.js';
import redirect from './redirect.js';

export default async function proxy(req: Request, res: Response) {
	try {
		let headers = {
			..._.pick(req.headers, ['cookie', 'dnt', 'referer']),
			'Accept-Encoding': '*',
			'user-agent': 'Bandwidth-Hero Compressor',
			'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip,
			'via': '1.1 bandwidth-hero',
		};

		console.log('[proxy]', { url: req.params.url, headers });

		let netResponse: AxiosResponse | null = await net({
			headers,
			url: req.params.url,
			responseType: 'stream',
		});

		if (!netResponse) throw new Error('no response (1)');

		let mediaMetadata: Metadata | null = null;

		let format: keyof FormatEnum | null = (req.params.webp ? 'webp' : 'jpeg') as keyof FormatEnum;
		let quality: number | null = parseInt(req.params.quality);
		let isGif: boolean | null = mediaMetadata!.format === 'gif';

		if (isGif && format === 'jpeg') {
			netResponse?.data.fill(0);

			netResponse!.data = null;
			format = null;
			quality = null;
			isGif = null;

			return redirect(req, res);
		}

		netResponse.data.pipe(
			sharp({ animated: isGif, limitInputPixels: false, failOn: 'none', unlimited: true })
				// .metadata(function (err: Error, metadata: Metadata) {
				// 	resolve(metadata);
				// })
				.grayscale(req.params.grayscale as any)
				.toFormat(format, { quality, effort: 6, progressive: true, optimizeScans: true, mozjpeg: true })
				.toBuffer(function (err: Error, buffer: Buffer, info: OutputInfo) {
					if (err) throw err;
					if (!netResponse) throw new Error('no response (2)');

					// let savedSize = mediaMetadata.size! - info.size;

					// if (savedSize < 0) {
					// 	netResponse?.data.fill(0);
					// 	buffer.fill(0);

					// 	netResponse!.data = null;
					// 	format = null;
					// 	quality = null;
					// 	isGif = null;

					// 	return redirect(req, res);
					// }

					// console.log('[compress]', {
					// 	time: getCurrentTime(),
					// 	url: req.params.url,
					// 	format,
					// 	originalSize: convertFileSize(mediaMetadata.size!),
					// 	compressedSize: convertFileSize(info.size),
					// 	savedSize: savedSize < 0 ? convertFileSize(Math.abs(savedSize)) : convertFileSize(savedSize),
					// 	quality,
					// 	isGif,
					// });

					copyHeaders(netResponse, res);
					res.setHeader('content-encoding', 'identity');
					res.setHeader('content-type', `image/${format}`);
					res.setHeader('content-length', info.size);
					// res.setHeader('x-original-size', mediaMetadata.size!);
					// res.setHeader('x-bytes-saved', savedSize);
					res.status(200);
					res.write(buffer);
					res.end().on('close', function () {
						netResponse?.data.fill(0);
						buffer.fill(0);

						netResponse!.data = null;
						format = null;
						quality = null;
						isGif = null;

						if (gc) gc();
						if (global.gc) global.gc();
					});
				}),
		);
	} catch (error: any) {
		console.log('[proxy]', 'Cannot compress,', error.message ?? error);

		return redirect(req, res);
	}
}
