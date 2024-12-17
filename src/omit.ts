export function omitEquals(object: Record<string, any>, omitKeys: string[]): Record<string, any> {
	const deepClone = structuredClone(object);
	for (const [key] of Object.entries(deepClone)) {
		for (const omitKey of omitKeys) {
			if (key.toLowerCase() === omitKey.toLowerCase()) {
				delete deepClone[key];
			}
		}
	}
	return deepClone;
}
