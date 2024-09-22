function beautifyData(data: any, level: number = 0) {
  const output: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object') {
      if (level !== 0) output.push(`${'  '.repeat(level - 1)}> ${key}:`);
      output.push(...beautifyData(value, level + 1));
    } else {
      output.push(`${'  '.repeat(level - 1)}> ${key}: ${value}`);
    }
  }

  return output;
}

export function beautifyObject(data: any, level: number = 0) {
  return beautifyData(data, level).join('\n');
}
