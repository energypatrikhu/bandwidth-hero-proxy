export function omitEquals(originalObject: Record<string, any>, keysToOmit: string[]): Record<string, any> {
	const clonedObject = structuredClone(originalObject);
	const lowerCaseKeysToOmit = new Set(keysToOmit.map((key) => key.toLowerCase()));

	for (const objectKey of Object.keys(clonedObject)) {
		if (lowerCaseKeysToOmit.has(objectKey.toLowerCase())) {
			delete clonedObject[objectKey];
		}
	}

	return clonedObject;
}

export function omitPartial(originalObject: Record<string, any>, keysToOmit: string[]): Record<string, any> {
	const clonedObject = structuredClone(originalObject);
	const lowerCaseKeysToOmit = new Set(keysToOmit.map((key) => key.toLowerCase()));

	for (const objectKey of Object.keys(clonedObject)) {
		for (const omitKey of lowerCaseKeysToOmit) {
			if (objectKey.includes(omitKey)) {
				delete clonedObject[objectKey];
			}
		}
	}

	return clonedObject;
}
