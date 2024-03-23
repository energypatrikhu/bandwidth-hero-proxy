import cluster from 'cluster';
import express from 'express';
import { availableParallelism, cpus } from 'os';
import sharp from 'sharp';

import { paramsParser } from './paramsParser.js';
import { proxy } from './proxy.js';

const numOfCpus = availableParallelism();

if (cluster.isPrimary) {
	for (let i = 0; i < numOfCpus; i++) {
		cluster.fork();
	}

	cluster.on('exit', (worker) => {
		console.log(`Worker ${worker.process.pid} died`);
		cluster.fork();
	});
} else {
	sharp.cache(false);
	sharp.simd(true);
	sharp.concurrency(cpus().length);

	const server = express();
	const port = process.env.PORT || 80;

	server.get('/', paramsParser, proxy);
	server.get('/favicon.ico', (_req, res) => res.status(204).end());
	server.listen(port, () => console.log(`Listening on ${port}`));

	setInterval(function () {
		if (gc) gc();
		else if (global.gc) global.gc();
	}, 5000);
}
