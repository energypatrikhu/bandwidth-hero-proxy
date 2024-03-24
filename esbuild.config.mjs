import { build } from 'esbuild';
import { existsSync } from 'fs';
import { readdir, rm, mkdir, readFile } from 'fs/promises';
import { join } from 'path';

const __destination = './build';

async function removeOldFiles() {
	console.log('Removing old files...');

	const files = await readdir(__destination, { withFileTypes: true });
	for await (const entry of files) {
		await rm(join(__destination, entry.name), { force: true, recursive: true });
	}
}

async function buildFiles() {
	console.log('Building files...');

	const packageJson = JSON.parse(await readFile('./package.json', { encoding: 'utf-8' }));

	await build({
		bundle: true,
		entryPoints: ['./src/index.ts'],
		platform: 'node',
		outdir: __destination,
		logLevel: 'debug',
		minify: true,
		format: 'esm',
		drop: ['console', 'debugger'],
		treeShaking: true,
		external: Object.keys(packageJson.dependencies || {}),
		mangleQuoted: true,
	});
}

(async function () {
	if (existsSync(__destination)) {
		await removeOldFiles();
	} else {
		await mkdir(__destination);
	}

	await buildFiles();
})();
