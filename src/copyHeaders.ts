import { AxiosResponse } from 'axios';
import { Response } from 'express';

export default function copyHeaders(source: AxiosResponse, target: Response) {
	for (let [key, value] of Object.entries(source.headers)) {
		try {
			target.setHeader(key, value);
		} catch (e) {
			console.log(e);
		}
	}
}
