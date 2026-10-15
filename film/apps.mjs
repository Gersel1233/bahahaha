// node apps.mjs still Spiis 0.5,1.2,...   — frames as pictures, to look at
// node apps.mjs render Spiis               — the film
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [mode, id, times] = process.argv.slice(2);
// only what the films use goes in the public folder, at the same paths as in
// the repository; every render copies the whole folder, so it is kept small
const USED = ['fonts/chivo-400.woff2', 'fonts/chivo-500.woff2', 'fonts/chivo-600.woff2', 'fonts/newsreader-300-italic.woff2', 'fonts/fragmentmono-400.woff2',
  'ny/media/dev/iphone-17-pro-2x.webp', 'ny/media/pg/mosede-web.webp', 'film/assets/dish.webp'];
const pub = path.resolve('pub');
for (const f of USED) { fs.mkdirSync(path.dirname(path.join(pub, f)), { recursive: true }); fs.copyFileSync(path.resolve('..', f), path.join(pub, f)); }
const serveUrl = await bundle({ entryPoint: path.resolve('src/apps/index.ts'), publicDir: pub });
const opts = { serveUrl, browserExecutable: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', chromiumOptions: { gl: 'swiftshader' }, chromeMode: 'chrome-for-testing' };
const composition = await selectComposition({ ...opts, id });
if (mode === 'still') {
  for (const s of times.split(',')) {
    const frame = Math.min(composition.durationInFrames - 1, Math.round(+s * composition.fps));
    await renderStill({ ...opts, composition, frame, output: path.resolve('out', `${id}-${s}.png`) });
  }
  console.log('stills done');
} else {
  let last = -1;
  await renderMedia({ ...opts, composition, codec: 'h264', crf: 16, outputLocation: path.resolve('out', id + '.mp4'), concurrency: 4,
    onProgress: ({ progress }) => { const p = Math.floor(progress * 5); if (p !== last) { last = p; console.log(id, p * 20 + '%'); } } });
  console.log('done', id);
}
