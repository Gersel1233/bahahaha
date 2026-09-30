/* The films, photographs, fonts and the mark live at the repository root,
   because the hand-written site on GitHub Pages still serves them from
   there and must go on working while this one is being built. Next wants
   them under public/, so they are copied in before every build rather
   than duplicated in git — one copy in the repository, two sites served
   from it. */
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const pub = join(here, '..', 'public');

/* the mark the tab shows, which lives at the root like the rest */
await cp(join(root, 'favicon.svg'), join(pub, 'favicon.svg')).catch(() => console.warn('skip: favicon.svg'));

/* The three scripts the page loads from the document rather than through
   the bundler: the phone is an ES module that imports three.js through an
   import map, and the other two were written to be dropped in with a
   script tag. They are served as they are. */
for (const f of ['telefon-3d.js', 'site.js', 'image-slot.js', 'loader.js']) {
  await cp(join(root, f), join(pub, f)).catch(() => console.warn('skip:', f));
}

for (const dir of ['media', 'photos', 'fonts', 'brand', 'vendor']) {
  const from = join(root, dir);
  if (!existsSync(from)) { console.warn('skip (missing):', dir); continue; }
  const to = join(pub, dir);
  await rm(to, { recursive: true, force: true });
  await mkdir(to, { recursive: true });
  await cp(from, to, { recursive: true, dereference: true });
  console.log('copied', dir);
}
