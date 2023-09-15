module.exports = {
	apps: [
		{
			name: 'bandwidth-hero-proxy',
			script: 'build/index.js',
			node_args: '--expose-gc',
		},
	],
};
