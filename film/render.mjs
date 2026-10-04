import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'node:path';
const id = process.argv[2] || 'Desktop';
const scale = Number(process.argv[3] || 1);
const out = path.resolve('out', id.toLowerCase() + '.mp4');
// the site's own folder is the film's public folder, so the picture is the same file
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('../ny') });
const opts = { serveUrl, browserExecutable: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  chromiumOptions: { gl: 'swiftshader' }, chromeMode: 'chrome-for-testing' };
const composition = await selectComposition({ ...opts, id });
let last = -1;
await renderMedia({ ...opts, composition, codec: 'h264', crf: 18, scale, outputLocation: out, concurrency: 4,
  onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; console.log(id, (p * 10) + '%'); } } });
console.log('done', out);
