import express, { type NextFunction, type Request, type Response } from 'express';
import cluster from 'cluster';
import { availableParallelism } from 'os';
import process from 'process';
import { logger } from '@energypatrikhu/node-utils';
import paramsParser from './params-parser.js';
import proxy from './proxy.js';

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
	const server = express();
	const port = process.env.PORT || 80;

	let lastRequestTime = Date.now();
	function updateLastRequestTime(_req: Request, _res: Response, next: NextFunction) {
		lastRequestTime = Date.now();
		next();
	}

	server.get('/', paramsParser, updateLastRequestTime, proxy);
	server.get('/favicon.ico', (_req, res) => {
		res.status(204).end();
		return;
	});
	server.listen(port, () => {
		logger('info', `Worker ${process.pid} listening on ${port}`);
	});

	setInterval(() => {
		if (Date.now() - lastRequestTime < 10 * 1000) return;
		if (Date.now() - lastRequestTime > 60 * 60 * 1000) return;

		if (gc) gc();
		else if (global.gc) global.gc();
	}, 5000);
}
