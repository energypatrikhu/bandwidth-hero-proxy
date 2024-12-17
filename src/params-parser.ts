import { NextFunction, Request, Response } from 'express';

const queryKeys = ['url', 'jpg', 'bw', 'l'] as const;
type QueryKeys = (typeof queryKeys)[number];

export default function paramsParser(request: Request, response: Response, next: NextFunction) {
	const requestSearchParams = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
	const searchParamEntries = requestSearchParams.entries();

	const query: Partial<Record<QueryKeys, string>> = {};
	const unknownQuery: string[] = [];

	for (const [key, value] of searchParamEntries) {
		if (queryKeys.includes(key as QueryKeys)) {
			query[key as QueryKeys] = value;
		} else {
			unknownQuery.push(value ? `&${key}=${value}` : `&${key}`);
		}
	}

	if (unknownQuery.length > 0) {
		query.url += unknownQuery.join('');
	}

	if (!query.url) {
		response.send('bandwidth-hero-proxy');
		return;
	}

	let url = query.url!;

	if (Array.isArray(url)) {
		url = url.join('&url=');
	}

	request.app.locals = {
		url: url.toString().replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://'),
		format: query.jpg !== '1' ? 'webp' : 'jpeg',
		grayscale: query.bw !== '0',
		quality: parseInt(query.l?.toString()!),
	};

	next();
}
