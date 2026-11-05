#!/usr/bin/env node
// Erzeugt die DRSKit-Einzelschläge unter src/audio/samples/drs/ (drum-samples, design.md D4 und D5).
// Braucht ffmpeg (mit libopus) im PATH. Läuft nicht im Build; die erzeugten Dateien liegen im Repository.
//   node scripts/drs-samples.mjs [--cache <Verzeichnis>]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'sfzinstruments/DrumGizmo.DRSKit';
const COMMIT = 'b01448990a31f722542f1812e56159a97a6a2a82';
const BASE = 'DrumGizmo/DRSKit/Samples';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'audio', 'samples', 'drs');
const RATE = 48000;

const AMBIENT = ['OHL', 'OHR', 'AmbL', 'AmbR'];
const SHELL = ['Snare_bottom', ...AMBIENT];
/** Aufnahmen je Instrument: Ordner, Nummer des normalen und des leisen Schlags, Mikrofone (design.md, Context). */
const KIT = {
  kick: { folder: 'Kdrum_with_contact', normal: 15, soft: 4, mics: ['Kdrum_back', ...SHELL] },
  snare: { folder: 'Snare', normal: 37, soft: 14, mics: ['Snare_top', ...SHELL] },
  tom1: { folder: 'Tom1', normal: 17, soft: 5, mics: ['Tom1', ...SHELL] },
  tom2: { folder: 'Tom2', normal: 13, soft: 4, mics: ['Tom2', ...SHELL] },
  floorTom: { folder: 'Tom3', normal: 13, soft: 4, mics: ['Tom3', ...SHELL] },
  hihat: { folder: 'Hihat_closed', normal: 13, soft: 4, mics: ['Hihat', ...AMBIENT] },
  hihatOpen: { folder: 'Hihat_open', normal: 9, soft: 3, mics: ['Hihat', ...AMBIENT] },
  hihatPedal: { folder: 'Hihat_foot', normal: 6, soft: 3, mics: ['Hihat', ...AMBIENT] },
  ride: { folder: 'Ride_tip', normal: 6, soft: 2, mics: ['Ride', ...AMBIENT] },
  crash: { folder: 'Crash_left_shank', normal: 9, soft: 4, mics: AMBIENT },
};
const LONG = new Set(['hihatOpen', 'ride', 'crash']);

const cacheArg = process.argv.indexOf('--cache');
const CACHE = cacheArg > 0 ? process.argv[cacheArg + 1] : join(tmpdir(), 'beatsheet-drs-cache');

async function fetchSample(path) {
  const local = join(CACHE, COMMIT, path);
  if (existsSync(local)) return local;
  mkdirSync(dirname(local), { recursive: true });
  const url = `https://raw.githubusercontent.com/${REPO}/${COMMIT}/${path.split('/').map(encodeURIComponent).join('/')}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  writeFileSync(`${local}.part`, Buffer.from(await response.arrayBuffer()));
  renameSync(`${local}.part`, local);
  return local;
}

/** Mono-Spur als Gleitkommazahlen bei RATE. */
function decode(file) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(RATE), '-'], {
    maxBuffer: 1 << 28,
  });
  return new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
}

/** Paare links und rechts, Nahmikrofone mittig, alle mit gleichem Pegel. */
async function mix(instrument, level) {
  const { folder, mics } = KIT[instrument];
  const number = KIT[instrument][level];
  const tracks = await Promise.all(
    mics.map(async (mic) => ({ mic, data: decode(await fetchSample(`${BASE}/${folder}/${number}-${folder}-${mic}.flac`)) })),
  );
  const length = Math.max(...tracks.map((t) => t.data.length));
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  for (const { mic, data } of tracks) {
    const toLeft = !mic.endsWith('R');
    const toRight = !mic.endsWith('L');
    for (let i = 0; i < data.length; i++) {
      if (toLeft) left[i] += data[i];
      if (toRight) right[i] += data[i];
    }
  }
  return [left, right];
}

/** Beginn 2 ms vor dem Einsatz (−40 dB), Ende bei −60 dB, höchstens maxSeconds, 30 ms Ausblenden. */
function trim([left, right], maxSeconds) {
  const env = left.map((l, i) => Math.max(Math.abs(l), Math.abs(right[i])));
  const peak = env.reduce((a, b) => Math.max(a, b), 0);
  const onset = env.findIndex((v) => v > peak * 10 ** (-40 / 20));
  const start = Math.max(0, onset - Math.round(0.002 * RATE));
  let last = env.length - 1;
  while (last > start && env[last] <= peak * 10 ** (-60 / 20)) last--;
  const end = Math.min(last + 1, start + Math.round(maxSeconds * RATE));
  const out = [left.slice(start, end), right.slice(start, end)];
  const fade = Math.min(end - start, Math.round(0.03 * RATE));
  for (const channel of out) {
    for (let i = 0; i < fade; i++) channel[channel.length - fade + i] *= 1 - i / fade;
  }
  return out;
}

function encode([left, right], gain, file, codec) {
  const interleaved = new Float32Array(left.length * 2);
  for (let i = 0; i < left.length; i++) {
    interleaved[2 * i] = left[i] * gain;
    interleaved[2 * i + 1] = right[i] * gain;
  }
  const args = codec === 'opus'
    ? ['-c:a', 'libopus', '-b:a', '96k', '-f', 'webm']
    : ['-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-f', 'mp4'];
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-f', 'f32le', '-ar', String(RATE), '-ac', '2', '-i', '-',
    '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', ...args, file,
  ], { input: Buffer.from(interleaved.buffer) });
}

const sounds = {};
for (const instrument of Object.keys(KIT)) {
  for (const level of ['normal', 'soft']) {
    sounds[`${instrument}-${level}`] = trim(await mix(instrument, level), LONG.has(instrument) ? 4 : 1.5);
    console.log(`${instrument}-${level}`);
  }
}

// Ein Pegelfaktor für das ganze Set: Effektivwert der ersten 200 ms der normalen Snare auf 0,18, Spitze höchstens 0,98
const [snareL, snareR] = sounds['snare-normal'];
const span = Math.round(0.2 * RATE);
let sum = 0;
for (let i = 0; i < span; i++) sum += (snareL[i] ** 2 + snareR[i] ** 2) / 2;
let gain = 0.18 / Math.sqrt(sum / span);
let peak = 0;
for (const channels of Object.values(sounds)) for (const c of channels) for (const v of c) peak = Math.max(peak, Math.abs(v));
if (peak * gain > 0.98) gain = 0.98 / peak;

mkdirSync(OUT, { recursive: true });
for (const [name, channels] of Object.entries(sounds)) {
  encode(channels, gain, join(OUT, `${name}.webm`), 'opus');
  encode(channels, gain, join(OUT, `${name}.m4a`), 'aac');
}
console.log(`Pegelfaktor ${gain.toFixed(4)}, Dateien in ${OUT}`);
