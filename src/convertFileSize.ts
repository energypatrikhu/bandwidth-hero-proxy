export function convertFileSize({ bytes, decimalPoint = 2 }: { bytes: number; decimalPoint?: number }) {
	if (bytes === 0) {
		return '0 iB';
	}

	const k = 1024;
	const sizes = ['iB', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	const convertedSize = (bytes / Math.pow(k, i)).toFixed(decimalPoint);

	return `${convertedSize} ${sizes[i]}`;
}
