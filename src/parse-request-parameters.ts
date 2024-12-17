import { NextFunction, Request, Response } from 'express';

const allowedQueryParameters = ['url', 'jpg', 'bw', 'l'] as const;
type AllowedQueryParameters = (typeof allowedQueryParameters)[number];

export function parseRequestParameters(request: Request, response: Response, next: NextFunction) {
	const requestQueryParams = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
	const filteredQueryParams: Partial<Record<AllowedQueryParameters, string>> = {};
	let extraQueryParams = '';

	for (const [key, value] of requestQueryParams.entries()) {
		if (allowedQueryParameters.includes(key as AllowedQueryParameters)) {
			filteredQueryParams[key as AllowedQueryParameters] = value;
		} else {
			extraQueryParams += value ? `&${key}=${value}` : `&${key}`;
		}
	}

	if (extraQueryParams) {
		filteredQueryParams.url += extraQueryParams;
	}

	if (!filteredQueryParams.url) {
		response.send('bandwidth-hero-proxy');
		return;
	}

	const finalUrl = Array.isArray(filteredQueryParams.url) ? filteredQueryParams.url.join('&url=') : filteredQueryParams.url;

	request.app.locals = {
		url: finalUrl.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://'),
		format: filteredQueryParams.jpg !== '1' ? 'webp' : 'jpeg',
		grayscale: filteredQueryParams.bw !== '0',
		quality: parseInt(filteredQueryParams.l || '0'),
	};

	next();
}
