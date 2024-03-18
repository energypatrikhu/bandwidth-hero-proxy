import { NextFunction, Request, Response } from 'express';

export function paramsParser(request: Request, response: Response, next: NextFunction) {
	let url = (request.query.url ?? '').toString();

	if (Array.isArray(url)) {
		url = url.join('&url=');
	}

	if (!url) {
		return response.send('bandwidth-hero-proxy');
	}

	url = url.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');
	request.params.url = url;
	request.params.format = request.query.jpg !== '1' ? 'webp' : 'jpeg';
	request.params.grayscale = (request.query.bw !== '0') as any;
	request.params.quality = parseInt(request.query.l.toString()) as any;

	next();
}
