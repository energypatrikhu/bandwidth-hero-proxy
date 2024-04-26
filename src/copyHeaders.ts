import { logger } from '@energypatrikhu/node-core-utils';
import { Response } from 'express';
import superagent from 'superagent';

export const copyHeaders = ({
	source,
	response,
}: {
	source: superagent.Response;
	response: Response;
}) => {
	for (const [key, value] of Object.entries(source.headers)) {
		try {
			response.setHeader(key, value?.toString()!);
		} catch (e) {
			logger('error', { worker: process.pid }, e);
		}
	}
};
