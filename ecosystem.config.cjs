module.exports = {
	apps: [
		{
			name: 'bandwidth-hero-proxy',
			script: 'build/index.js',
			node_args:
				'--expose-gc --max-old-space-size=128 --jitless --no-opt --no-concurrent-recompilation --noexpose_wasm --max-semi-space-size=4',
		},
	],
};
