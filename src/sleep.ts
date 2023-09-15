export default function sleep(msMin: number, msMax?: number): Promise<void> {
	const timeout = Math.abs(msMin) + (!!msMax ? Math.floor(Math.random() * Math.abs(msMax - msMin + 1)) : 0);
	console.log(`> Sleep: ${new Intl.NumberFormat('de').format(timeout)}ms`);

	return new Promise(function (resolve) {
		return setTimeout(resolve, timeout);
	});
}
