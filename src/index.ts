import express, { type NextFunction, type Request, type Response } from 'express';
import cluster from 'cluster';
import { availableParallelism } from 'os';
import process from 'process';
import { logger } from '@energypatrikhu/node-utils';
import { parseRequestParameters } from './utils/parse-request-parameters';
import { handleImageProxyRequest } from './utils/handle-image-proxy-request';
import sharp from 'sharp';

// @ts-ignore
import queue from 'express-queue';

const maxClusterSize = process.env.MAX_CLUSTER_SIZE || '4';
const cpuCount = Math.min(availableParallelism(), parseInt(maxClusterSize, 10));
const clusterSize = process.env.CLUSTER_SIZE ? parseInt(process.env.CLUSTER_SIZE, 10) : cpuCount;
const queueSize = process.env.QUEUE_SIZE_PER_CLUSTER ? parseInt(process.env.QUEUE_SIZE_PER_CLUSTER, 10) : clusterSize;

const sharpConcurrency = process.env.SHARP_CONCURRENCY ? parseInt(process.env.SHARP_CONCURRENCY, 10) : 0;
const sharpCache = process.env.SHARP_CACHE ? process.env.SHARP_CACHE === 'true' : true;
const sharpSimd = process.env.SHARP_SIMD ? process.env.SHARP_SIMD === 'true' : true;

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
	sharp.concurrency(sharpConcurrency);
	sharp.cache(sharpCache);
	sharp.simd(sharpSimd);

	const app = express();
	const serverPort = process.env.PORT || 80;

	app.use(queue({ activeLimit: queueSize, queuedLimit: -1 }));

	let lastRequestTimestamp = Date.now();

	const updateLastRequestTimestamp = (_req: Request, _res: Response, next: NextFunction) => {
		lastRequestTimestamp = Date.now();
		next();
	};

	app.get('/', parseRequestParameters, updateLastRequestTimestamp, handleImageProxyRequest);
	// app.get('/', parseRequestParameters, handleImageProxyRequest);
	app.get('/favicon.ico', (_req, res) => {
		res.sendStatus(204);
	});

	app.listen(serverPort, () => {
		logger('info', `Worker process ${process.pid} listening on port ${serverPort}`);

		setInterval(() => {
			const timeSinceLastRequest = Date.now() - lastRequestTimestamp;
			if (timeSinceLastRequest < 10 * 1000 || timeSinceLastRequest > 60 * 1000) return;

			if (globalThis.gc) globalThis.gc();
		}, 5000);
	});
}
