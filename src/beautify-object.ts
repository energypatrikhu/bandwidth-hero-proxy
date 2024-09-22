function beautifyData(data: any, level: number = 0) {
  const output: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object') {
      output.push(...beautifyData(value, level + 1));
    } else {
      if (level === 0) output.push(`\n> ${key}: ${value}`);
      else output.push(`${'  '.repeat(level)}> ${key}: ${value}`);
    }
  }

  return output;
}

export function beautifyObject(data: any, level: number = 0) {
  return beautifyData(data, level).join('\n');
}
