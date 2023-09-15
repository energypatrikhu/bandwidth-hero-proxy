import { Request, Response } from 'express';
import _ from 'lodash';
import sharp, { FormatEnum } from 'sharp';

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

		let netResponse = await net({
			headers,
			url: req.params.url,
			responseType: 'stream',
		});

		let format = (req.params.webp ? 'webp' : 'jpeg') as keyof FormatEnum;
		let quality = parseInt(req.params.quality);

		let sharpStream = sharp({ limitInputPixels: false, failOn: 'none', unlimited: true })
			.grayscale(req.params.grayscale as any)
			.toFormat(format, { quality, effort: 6, progressive: true, optimizeScans: true, mozjpeg: true });

		netResponse.data.pipe(sharpStream).pipe(res);

		if (gc) gc();
		if (global.gc) global.gc();
	} catch (error: any) {
		console.log('[proxy]', 'Cannot compress,', error.message ?? error);

		return redirect(req, res);
	}
}
