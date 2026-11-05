import { createReadStream } from 'node:fs';
import { lstat } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import { extname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
  // Aufnahmen des Klangs (drum-samples, design.md D4)
  '.webm': 'audio/webm',
  '.m4a': 'audio/mp4',
};

/** Segmente des Pfads; `null`, wenn er ungültig ist, das Verzeichnis verlassen könnte oder zur API gehört (design.md D2). */
function segmentsOf(path: string): string[] | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return null;
  }
  const segments = decoded.split(/[\\/]/).filter(Boolean);
  if (segments[0] === 'api' || segments.some((segment) => segment.startsWith('.') || segment.includes('\0'))) return null;
  return segments;
}

/** Liefert eine Datei der Oberfläche aus; `false`, wenn es zu diesem Pfad keine gibt. */
export async function serveStatic(root: string, path: string, method: 'GET' | 'HEAD', response: ServerResponse): Promise<boolean> {
  const segments = segmentsOf(path);
  if (!segments) return false;
  const file = segments.length > 0 ? join(root, ...segments) : join(root, 'index.html');
  const stats = await lstat(file).catch(() => null);
  if (!stats?.isFile()) return false;

  response.writeHead(200, {
    'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': stats.size,
    'Cache-Control': segments[0] === 'assets' ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  if (method === 'HEAD') {
    response.end();
    return true;
  }
  // Ein Abbruch durch den Client ist kein Fehler; der Status ist dann schon gesendet
  await pipeline(createReadStream(file), response).catch(() => response.destroy());
  return true;
}
