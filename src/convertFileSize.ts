export default function convertFileSize(bytes: number, decimalPoint?: number) {
	if (bytes == 0) return '0 B';
	let k = 1024;
	let dm = decimalPoint || 2;
	let sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	let i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
