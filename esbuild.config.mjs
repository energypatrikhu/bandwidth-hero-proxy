import { build } from 'esbuild';
import { existsSync } from 'fs';
import { mkdir, readdir, rm, readFile } from 'fs/promises';
import { join } from 'path';

let __source = './src';
let __destination = './build';

if (existsSync(__destination)) {
	console.log('Removing old files...');

	for await (let entry of await readdir(__destination, { withFileTypes: true })) {
		await rm(join(__destination, entry.name), { force: true, recursive: true });
	}
} else {
	await mkdir(__destination);
}

console.log('Building files...');
let entries = (await readdir(__source, { withFileTypes: true }))
	.filter(function (entry) {
		return entry.isFile();
	})
	.map(function (entry) {
		return join(__source, entry.name);
	});

let packageJson = JSON.parse(await readFile('./package.json', { encoding: 'utf-8' }));

await build({
	bundle: true,
	entryPoints: entries,
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
