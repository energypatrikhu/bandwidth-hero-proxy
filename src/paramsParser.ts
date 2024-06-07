import { NextFunction, Request, Response } from 'express';

export default function paramsParser(request: Request, response: Response, next: NextFunction) {
	if (!request.query.url) {
		return response.send('bandwidth-hero-proxy');
	}

	let url = request.query.url;

	if (Array.isArray(url)) {
		url = url.join('&url=');
	}

	request.app.locals = {
		url: url.toString().replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://'),
		format: request.query.jpg !== '1' ? 'webp' : 'jpeg',
		grayscale: request.query.bw !== '0',
		quality: parseInt(request.query.l?.toString()!),
	};

	return next();
}
