import { IncomingMessage, ServerResponse } from 'http';

export function redirect({ request, response, params }: { request: IncomingMessage; response: ServerResponse<IncomingMessage>; params: any }) {
	if (response.headersSent) return;

	response.setHeader('content-length', 0);
	response.removeHeader('cache-control');
	response.removeHeader('expires');
	response.removeHeader('date');
	response.removeHeader('etag');
	response.setHeader('location', encodeURI(params.url));
	response.statusCode = 302;

	response.end();
	response.flushHeaders();
	response.destroy();
	response = null;
	request.drop(Infinity);
	request.destroy();
	request = null;
}
