import express from 'express';

import paramsParser from './paramsParser.js';
import proxy from './proxy-stream.js';

let app = express();

let PORT = process.env.PORT || 16406;

app.enable('trust proxy');
app.get('/', paramsParser, proxy);
app.get('/favicon.ico', (_, res) => res.status(204).end());
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

setInterval(() => {
	if (gc) gc();
	if (global.gc) global.gc();
}, 1000);
