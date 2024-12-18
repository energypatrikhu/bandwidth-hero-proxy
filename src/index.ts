import express, { type NextFunction, type Request, type Response } from 'express';
import cluster from 'cluster';
import { availableParallelism } from 'os';
import process from 'process';
import { logger } from '@energypatrikhu/node-utils';
import { parseRequestParameters } from './utils/parse-request-parameters';
import { handleImageProxyRequest } from './utils/handle-image-proxy-request';

// @ts-ignore
import queue from 'express-queue';

const maxClusterSize = process.env.MAX_CLUSTER_SIZE || '4';
const cpuCount = Math.min(availableParallelism(), parseInt(maxClusterSize, 10));
const clusterSize = parseInt(process.env.CLUSTER_SIZE || '0', 10) || cpuCount;
const queueSize = parseInt(process.env.QUEUE_SIZE_PER_CLUSTER || '0', 10) || 4;

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

	app.use(queue({ activeLimit: queueSize, queuedLimit: -1 }));

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
