import { IncomingMessage, ServerResponse } from 'http';

export const redirect = ({
	request,
	response,
	params,
}: {
	request: IncomingMessage;
	response: ServerResponse<IncomingMessage>;
	params: any;
}) => {
	if (response.headersSent) return;

	response.writeHead(302, {
		'Content-Length': '0',
		'Location': encodeURI(params.url),
	});

	response.end();
	request.destroy();
};
