type Data = { [key: string]: any };

function beautifyData(data: Data, level: number = 0): string[] {
	const output: string[] = [];

	for (const [key, value] of Object.entries(data)) {
		if (typeof value === 'object' && value !== null) {
			output.push(`${'  '.repeat(level)}> ${key}:`);
			output.push(...beautifyData(value, level + 1));
		} else {
			output.push(`${'  '.repeat(level)}> ${key}: ${value}`);
		}
	}

	return output;
}

export function beautifyObject(data: Data, level: number = 0): string {
	return beautifyData(data, level).join('\n');
}
