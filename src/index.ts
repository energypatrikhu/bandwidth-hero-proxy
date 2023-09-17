import { createServer } from 'http';

import compress from './compress.js';

createServer(function (request, response) {
	let url = new URL('http://' + request.headers['host']! + request.url);

	let path = url.pathname.endsWith('/') ? url.pathname.slice(-1) : url.pathname;

	switch (path) {
		case '/': {
			compress(request, response);
			break;
		}
		case '/favicon.ico': {
			response.statusCode = 204;
			response.end();
			break;
		}
		default: {
			response.statusCode = 404;
			response.end();
			break;
		}
	}
}).listen(16406);
