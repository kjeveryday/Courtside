// One-shot generator for the committed placeholder tape frame (DEC-4/AD-5):
// a tiny PNG sketching a DebugBattle-ish board. frame-002 is deliberately NOT
// generated — its absence exercises the viewer's "missing/unverifiable" state.
import { deflateSync, crc32 } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const W = 320;
const H = 180;
const px = new Uint8Array(W * H * 3);
const set = (x, y, r, g, b) => {
  const i = (y * W + x) * 3;
  px[i] = r;
  px[i + 1] = g;
  px[i + 2] = b;
};
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    let c = [20, 23, 28]; // bg #14171C
    if (x % 24 === 0 || y % 24 === 0) c = [42, 49, 59]; // grid lines
    if (x === 1 || y === 1 || x === W - 2 || y === H - 2) c = [232, 163, 61]; // court edge
    set(x, y, c[0], c[1], c[2]);
  }
// a few "unit" blocks
for (let y = 72; y < 92; y++) for (let x = 96; x < 116; x++) set(x, y, 107, 147, 196);
for (let y = 120; y < 140; y++) for (let x = 192; x < 212; x++) set(x, y, 76, 175, 125);

const chunk = (type, data) => {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0);
  return Buffer.concat([len, t, data, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // RGB
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0; // filter: none
  Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
]);
const dir = new URL('../spec/fixtures/sample-project/plan/tape/TASK-12/', import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL('frame-001.png', dir), png);
console.log(`Wrote tape frame-001.png (${png.length} bytes); frame-002 intentionally absent.`);
