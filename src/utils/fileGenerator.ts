import fs from 'fs-extra';
import path from 'path';

export async function createDirectory(dirPath: string): Promise<boolean> {
  if (await fs.pathExists(dirPath)) {
    return true;
  }
  await fs.ensureDir(dirPath);
  return false;
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}
