import { NextFunction, Response } from 'express';

export default function paramsParser(req: any, res: Response, next: NextFunction) {
	let url = req.query.url;
	if (Array.isArray(url)) url = url.join('&url=');
	if (!url) return res.end('bandwidth-hero-proxy');

	url = url.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');
	req.params.url = url;
	req.params.webp = req.query.jpg != '1';
	req.params.grayscale = req.query.bw != '0';
	req.params.quality = parseInt(req.query.l);

	next();
}
