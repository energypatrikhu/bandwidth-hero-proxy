export function omitEquals(originalObject: Record<string, any>, keysToOmit: string[]): Record<string, any> {
	const clonedObject = structuredClone(originalObject);
	const lowerCaseKeysToOmit = new Set(keysToOmit.map((key) => key.toLowerCase()));

	for (const key of Object.keys(clonedObject)) {
		if (lowerCaseKeysToOmit.has(key.toLowerCase())) {
			delete clonedObject[key];
		}
	}

	return clonedObject;
}
