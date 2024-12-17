import express, { type NextFunction, type Request, type Response } from 'express';
import cluster from 'cluster';
import { availableParallelism } from 'os';
import process from 'process';
import { logger } from '@energypatrikhu/node-utils';
import { parseRequestParameters } from './parse-request-parameters.js';
import { handleImageProxyRequest } from './handle-image-proxy-request.js';

const maxClusterSize = process.env.MAX_CLUSTER_SIZE || 4;
const cpuCount = availableParallelism();
const clusterSize = Math.min(cpuCount, parseInt(maxClusterSize.toString(), 10));

if (cluster.isPrimary) {
	logger('info', `Primary process ${process.pid} is running`);

	for (let i = 0; i < clusterSize; i++) {
		cluster.fork();
	}

	cluster.on('exit', (worker) => {
		logger('warn', `Worker process ${worker.process.pid} died`);
		cluster.fork();
	});
} else {
	const app = express();
	const serverPort = process.env.PORT || 80;

	let lastRequestTimestamp = Date.now();

	const updateLastRequestTimestamp = (_req: Request, _res: Response, next: NextFunction) => {
		lastRequestTimestamp = Date.now();
		next();
	};

	app.get('/', parseRequestParameters, updateLastRequestTimestamp, handleImageProxyRequest);
	app.get('/favicon.ico', (_req, res) => {
		res.sendStatus(204);
	});

	app.listen(serverPort, () => {
		logger('info', `Worker process ${process.pid} listening on port ${serverPort}`);

		setInterval(() => {
			const timeSinceLastRequest = Date.now() - lastRequestTimestamp;
			if (timeSinceLastRequest < 10 * 1000 || timeSinceLastRequest > 60 * 60 * 1000) return;

			if (global.gc) global.gc();
		}, 5000);
	});
}
