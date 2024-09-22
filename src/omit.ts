export function omitIncludes(object: Record<string, any>, omitKeys: string[]): Record<string, any> {
  const deepClone = structuredClone(object);
  for (const [key] of Object.entries(deepClone)) {
    for (const omitKey of omitKeys) {
      if (key.includes(omitKey)) {
        delete deepClone[key];
      }
    }
  }
  return deepClone;
}

export function omitStartWith(object: Record<string, any>, omitKeys: string[]): Record<string, any> {
  const deepClone = structuredClone(object);
  for (const [key] of Object.entries(deepClone)) {
    for (const omitKey of omitKeys) {
      if (key.startsWith(omitKey)) {
        delete deepClone[key];
      }
    }
  }
  return deepClone;
}

export function omitEndsWith(object: Record<string, any>, omitKeys: string[]): Record<string, any> {
  const deepClone = structuredClone(object);
  for (const [key] of Object.entries(deepClone)) {
    for (const omitKey of omitKeys) {
      if (key.endsWith(omitKey)) {
        delete deepClone[key];
      }
    }
  }
  return deepClone;
}
