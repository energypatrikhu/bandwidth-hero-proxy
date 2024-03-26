import express from 'express';
import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import process from 'node:process';
import sharp from 'sharp';

import { paramsParser } from './paramsParser.js';
import { proxy } from './proxy.js';

const numOfCpus = availableParallelism();

if (cluster.isPrimary) {
	console.log(`Primary ${process.pid} is running`);

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
	sharp.concurrency(numOfCpus);

	const server = express();
	const port = process.env.PORT || 80;

	server.get('/', paramsParser, proxy);
	server.get('/favicon.ico', (_req, res) => res.status(204).end());
	server.listen(port, () => {
		console.log(`Worker ${process.pid} listening on ${port}`);
	});

	setInterval(() => {
		if (gc) gc();
		else if (global.gc) global.gc();
	}, 5000);
}
