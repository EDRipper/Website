// Checks the live (or local) site's SEO and agent-facing endpoints.
// Usage: npm run verify:agents -- [base URL]   (default https://www.euans.life)
const base = (process.argv[2] ?? 'https://www.euans.life').replace(/\/$/, '');
const BROWSER = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

const checks = [];
const check = (name, fn) => checks.push({ name, fn });
const get = (path, accept, method = 'GET') =>
	fetch(base + path, { method, redirect: 'manual', headers: accept ? { accept } : {} });
const varies = (res) => /(^|,)\s*accept\s*(,|$)/i.test(res.headers.get('vary') ?? '');
function expect(cond, msg) {
	if (!cond) throw new Error(msg);
}

check('GET / with Accept: text/markdown → markdown + Vary: Accept', async () => {
	const res = await get('/', 'text/markdown');
	expect(res.status === 200, `status ${res.status}`);
	expect(res.headers.get('content-type') === 'text/markdown; charset=utf-8', `content-type ${res.headers.get('content-type')}`);
	expect(varies(res), `vary ${res.headers.get('vary')}`);
	expect((await res.text()).startsWith('# Euan Ripper'), 'body does not start with "# Euan Ripper"');
});
check('HEAD / with Accept: text/markdown → markdown headers', async () => {
	const res = await get('/', 'text/markdown', 'HEAD');
	expect(res.headers.get('content-type')?.startsWith('text/markdown'), `content-type ${res.headers.get('content-type')}`);
});
check('GET / as a browser → HTML + Vary: Accept + SEO head', async () => {
	const res = await get('/', BROWSER);
	const html = await res.text();
	expect(res.headers.get('content-type')?.startsWith('text/html'), `content-type ${res.headers.get('content-type')}`);
	expect(varies(res), `vary ${res.headers.get('vary')}`);
	expect(html.includes('<link rel="canonical"'), 'no canonical');
	expect(html.includes('<meta name="description"'), 'no meta description');
	const ld = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html);
	expect(ld, 'no JSON-LD');
	expect(JSON.parse(ld[1])['@graph'].some((n) => n['@type'] === 'Person'), 'JSON-LD has no Person');
});
check('GET / with q-values preferring markdown → markdown', async () => {
	const res = await get('/', 'text/html;q=0.5, text/markdown');
	expect(res.headers.get('content-type')?.startsWith('text/markdown'), `content-type ${res.headers.get('content-type')}`);
});
check('GET / with Accept: application/pdf → 406', async () => {
	const res = await get('/', 'application/pdf');
	expect(res.status === 406, `status ${res.status}`);
});
check('GET /index.md → markdown', async () => {
	const res = await get('/index.md');
	expect(res.status === 200 && res.headers.get('content-type')?.startsWith('text/markdown'), `status ${res.status}`);
});
check('GET /blog/stickers with Accept: text/markdown → markdown', async () => {
	const res = await get('/blog/stickers', 'text/markdown');
	expect(res.status === 200 && (await res.text()).startsWith('# Stickers'), `status ${res.status}`);
});
check('GET a nonexistent path (Accept */*) → 404 with markdown body', async () => {
	const res = await get('/some-path-that-does-not-exist', '*/*');
	const body = await res.text();
	expect(res.status === 404, `status ${res.status}`);
	expect(res.headers.get('content-type')?.startsWith('text/markdown'), `content-type ${res.headers.get('content-type')}`);
	expect(body.includes('/llms.txt') && body.includes('/sitemap.xml'), 'body lacks recovery links');
});
check('GET a nonexistent path as a browser → 404 HTML', async () => {
	const res = await get('/some-path-that-does-not-exist', BROWSER);
	expect(res.status === 404 && res.headers.get('content-type')?.startsWith('text/html'), `status ${res.status}`);
});
check('GET /blog/not-a-post → 404', async () => {
	const res = await get('/blog/not-a-post', BROWSER);
	expect(res.status === 404, `status ${res.status}`);
});
check('GET /llms.txt → llmstxt.org format with "When to use"', async () => {
	const res = await get('/llms.txt');
	const txt = await res.text();
	expect(res.status === 200, `status ${res.status}`);
	expect(txt.startsWith('# Euan Ripper\n\n> '), 'does not start with H1 + blockquote');
	expect(txt.includes('\n## When to use\n'), 'no "When to use" section');
});
check('GET /llms-full.txt → 200', async () => {
	const res = await get('/llms-full.txt');
	expect(res.status === 200, `status ${res.status}`);
});
check('GET /sitemap.xml → urlset', async () => {
	const res = await get('/sitemap.xml');
	expect(res.status === 200 && (await res.text()).includes('<urlset'), `status ${res.status}`);
});
check('GET /robots.txt → references the sitemap', async () => {
	const res = await get('/robots.txt');
	expect(res.status === 200 && /^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m.test(await res.text()), `status ${res.status}`);
});

let failed = 0;
for (const { name, fn } of checks) {
	try {
		await fn();
		console.log(`PASS  ${name}`);
	} catch (e) {
		failed++;
		console.log(`FAIL  ${name}: ${e.message}`);
	}
}
console.log(`\n${checks.length - failed}/${checks.length} passed against ${base}`);
process.exit(failed ? 1 : 0);
