module.exports = {
	apps: [
		{
			name: 'bandwidth-hero-proxy',
			script: 'build/index.js',
			node_args: '--expose-gc --max-old-space-size=128 --max-semi-space-size=4',
		},
	],
};
