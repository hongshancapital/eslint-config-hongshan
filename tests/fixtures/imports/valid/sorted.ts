import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filePath = path.join(fileURLToPath(new URL('.', import.meta.url)), 'test.txt');

export async function readTestFile() {
  const content = await readFile(filePath, 'utf8');

  return content;
}
