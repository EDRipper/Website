# Rebuilding a version snapshot

`/versions` lists every pushed version, and each one is a **real static build** of the site as it
stood at that commit, served from `static/vN/`. They're built by hand when a version is cut, not on
every deploy — this is the recipe.

The builds are throwaway git worktrees, so nothing here changes the version's actual history.

## 1. A worktree at the commit

```sh
git worktree add /tmp/snap/v5 <sha>
```

## 2. Share the dependencies

Every version so far has a byte-identical `package.json` and `package-lock.json`, so one
`node_modules` serves them all — no need to install per worktree. On Windows:

```powershell
New-Item -ItemType Junction -Path /tmp/snap/v5/node_modules -Target <repo>/node_modules
```

(on macOS/Linux, `ln -s`). The static adapter isn't a project dependency, so add it to that shared
folder without touching the manifests:

```sh
npm i --no-save --no-package-lock @sveltejs/adapter-static
```

If a future version changes the lockfile, drop the junction and run `npm ci` in the worktree.

## 3. Override the build config

Replace the worktree's `svelte.config.js` with the snapshot config: `adapter-static`,
`paths.base` from a **bare** name, prerendering only the home page, and skipping `static/`.

```js
import adapter from '@sveltejs/adapter-static';

const name = process.env.SNAPSHOT_NAME || '';
const base = name ? `/${name}` : '';

export default {
  compilerOptions: {
    runes: ({ filename }) => (filename.includes('node_modules') ? undefined : true)
  },
  kit: {
    adapter: adapter({ pages: 'build', assets: 'build', strict: false }),
    paths: { base },
    files: { assets: 'empty-static' },
    prerender: { crawl: false, entries: ['/'], handleHttpError: 'warn', handleMissingId: 'warn' }
  }
};
```

Then `mkdir empty-static` and add `src/routes/+page.ts` containing `export const prerender = true;`.

Three things here are load-bearing:

- **`crawl: false` + `entries: ['/']`** — only the home page is prerendered. The site has `/api`
  endpoints, a DB-backed `/recs` and a dynamic `/blog/[slug]`; crawling would try to prerender them
  and fail. `strict: false` allows the rest to be missing.
- **`files.assets` pointing at an empty folder** — skips copying `static/`. Fonts and images are
  byte-identical across versions (v2→v4 only *added* `beest-walk.webp`), and hand-written
  `/images/...` paths ignore `paths.base` anyway, so they resolve to the live site's copies. Copying
  them per snapshot would add ~11MB each for nothing.
- **A bare name, not a path.** Passing `SNAPSHOT_BASE=/v5` through Git Bash arrives in node as
  `C:/Program Files/Git/v5` — MSYS rewrites leading-slash values. Pass `v5` and build the slash in JS.

## 4. Build and install

```sh
cd /tmp/snap/v5 && SNAPSHOT_NAME=v5 npx vite build
rm -rf <repo>/static/v5 && cp -r build/. <repo>/static/v5/
git worktree remove /tmp/snap/v5 --force
```

## 5. Wire it up

Add `src/routes/v5/+server.ts`:

```ts
import { redirect } from '@sveltejs/kit';
export const GET = () => redirect(308, '/v5/index.html');
```

The redirect target **must keep `/index.html`**. SvelteKit emits relative asset URLs
(`./_app/...`), which is what makes a snapshot portable — but resolving them from `/v5` with no
trailing segment would point at the site root and load the *current* bundles instead. `/v5/` works
too; `/v5/index.html` is just explicit.

Finally add the entry to the `versions` array in `src/routes/versions/+page.svelte`.

## Known limits

Snapshots are the home page only. Links inside them (`/blog/...`, the social icons, the song
previews' `/api/preview`) lead back to the live site rather than the archived one.
