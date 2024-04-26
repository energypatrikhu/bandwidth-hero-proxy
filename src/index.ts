import express from 'express';
import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import process from 'node:process';
import sharp from 'sharp';

import { paramsParser } from './paramsParser.js';
import { proxy } from './proxy.js';
import { logger } from '@energypatrikhu/node-core-utils';

const numOfCpus = availableParallelism();

if (cluster.isPrimary) {
	logger('info', `Primary ${process.pid} is running`);

	for (let i = 0; i < numOfCpus; i++) {
		cluster.fork();
	}

	cluster.on('exit', (worker) => {
		logger('warn', `Worker ${worker.process.pid} died`);
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
		logger('info', `Worker ${process.pid} listening on ${port}`);
	});

	setInterval(() => {
		if (gc) gc();
		else if (global.gc) global.gc();
	}, 5000);
}
