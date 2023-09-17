export default function paramsParser(request: any) {
	let searchParams = new URL('http://' + request.headers['host']! + request.url).searchParams;

	let url = searchParams.get('url');

	if (Array.isArray(url)) url = url.join('&url=');
	if (!url) return 'bandwidth-hero-proxy';

	url = url.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');
	return {
		url,
		format: (searchParams.get('jpg') != '1' ? 'webp' : 'jpeg') as 'jpeg' | 'webp',
		grayscale: searchParams.get('bw') != '0',
		quality: parseInt(searchParams.get('l')!),
	};
}
