export default function sleep(msMin: number, msMax?: number): Promise<void> {
	const timeout = Math.abs(msMin) + (!!msMax ? Math.floor(Math.random() * Math.abs(msMax - msMin + 1)) : 0);

	return new Promise(function (resolve) {
		return setTimeout(resolve, timeout);
	});
}
