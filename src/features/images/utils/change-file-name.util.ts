import { randomUUID } from 'crypto';
import { extname } from 'path';

export function changeFileName(name: string) {
  const extension = extname(name).toLowerCase();
  return `${randomUUID()}${extension}`;
}
