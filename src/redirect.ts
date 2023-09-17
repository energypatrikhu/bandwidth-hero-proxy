import { IncomingMessage, ServerResponse } from 'http';

export default function redirect(request: IncomingMessage, response: ServerResponse<IncomingMessage>, params: any) {
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
	request.drop(Infinity);
	request.destroy();

	if (gc) gc();
	else if (global.gc) global.gc();
}
