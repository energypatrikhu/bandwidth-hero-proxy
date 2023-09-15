import { createHmac } from 'crypto';
import { Request, Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { mkdir, rm } from 'fs/promises';
import _ from 'lodash';
import { join } from 'path';
import sharp, { FormatEnum } from 'sharp';

import convertFileSize from './convertFileSize.js';
import copyHeaders from './copyHeaders.js';
import generateRandomUserAgent from './generateRandomUserAgent.js';
import net from './net.js';
import redirect from './redirect.js';

export default async function proxy(req: Request, res: Response) {
	try {
		let headers = {
			..._.pick(req.headers, ['cookie', 'dnt', 'referer']),
			'User-Agent': generateRandomUserAgent(),
			'Accept-Encoding': '*',
			'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip,
		};

		console.log('[proxy]', { headers });

		let netResponse = await net({
			headers,
			url: req.params.url,
			responseType: 'stream',
		});

		// await sleep(1000, 5000);

		copyHeaders(netResponse, res);

		let format = (req.params.webp ? 'webp' : 'jpeg') as keyof FormatEnum;
		let quality = parseInt(req.params.quality);
		let isGif = netResponse.headers['Content-Type'] ? netResponse.headers['Content-Type'].toString().includes('gif') : netResponse.config.url?.endsWith('gif');
		let tmpFileName = createHmac('sha512', Date.now().toString() + netResponse.config.url).digest('hex');
		let tmpFilePathBase = './tmp';
		let tmpFilePath = join(tmpFilePathBase, tmpFileName);

		if (!existsSync(tmpFilePathBase)) await mkdir(tmpFilePathBase, { recursive: true });

		netResponse.data.pipe(
			sharp({ animated: isGif, limitInputPixels: false, failOn: 'none', unlimited: true })
				.toFormat(format, { quality, effort: 6, progressive: true, optimizeScans: true, mozjpeg: true })
				.toFile(tmpFilePath, async function (err, { size }) {
					if (err) return redirect(req, res);

					console.log('[compress]', {
						format,
						tmpFileName,
						size: convertFileSize(size),
						quality,
						isGif,
					});

					res.setHeader('content-encoding', 'identity');
					res.setHeader('content-type', `image/${format}`);
					res.setHeader('content-length', size);
					res.setHeader('x-original-size', 0);
					res.setHeader('x-bytes-saved', size);

					let readStream = createReadStream(tmpFilePath);

					readStream.pipe(res).on('finish', async function () {
						readStream.close();

						await rm(tmpFilePath, { force: true });

						if (gc) gc();
						if (global.gc) global.gc();
					});
				}),
		);
	} catch (error) {
		console.log('[proxy]', error);

		return redirect(req, res);
	} finally {
		if (gc) gc();
		if (global.gc) global.gc();
	}
}
