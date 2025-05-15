export function omitRegex(
  originalObject: Record<string, any>,
  regex: RegExp[],
): Record<string, any> {
  const clonedObject = structuredClone(originalObject);

  for (const objectKey of Object.keys(clonedObject)) {
    for (const re of regex) {
      if (re.test(objectKey)) {
        delete clonedObject[objectKey];
        break;
      }
    }
  }

  return clonedObject;
}
