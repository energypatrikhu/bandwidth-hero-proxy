import express from 'express';
import { cpus } from 'os';
import sharp from 'sharp';

import { paramsParser } from './paramsParser.js';
import { proxy } from './proxy.js';

sharp.cache(false);
sharp.simd(true);
sharp.concurrency(cpus().length);

const server = express();
const PORT = 80;

server.get('/', paramsParser, proxy);
server.get('/favicon.ico', (req, res) => res.status(204).end());
server.listen(PORT, () => console.log(`Listening on ${PORT}`));

setInterval(function () {
	if (gc) gc();
	else if (global.gc) global.gc();
}, 5000);
