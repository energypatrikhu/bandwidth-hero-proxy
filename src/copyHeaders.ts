import { AxiosResponse } from 'axios';
import { IncomingMessage, ServerResponse } from 'http';

export default function copyHeaders(source: AxiosResponse, response: ServerResponse<IncomingMessage>) {
	for (let [key, value] of Object.entries(source.headers)) {
		try {
			response.setHeader(key, value?.toString()!);
		} catch (e) {
			console.log(e);
		}
	}
}
