import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { handle } from './hooks.server';
import { SITE_URL } from '$lib/content';

const BROWSER = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

function run(
	path: string,
	{ accept, method = 'GET', status = 200, isDataRequest = false }: { accept?: string; method?: string; status?: number; isDataRequest?: boolean } = {}
) {
	const url = new URL(path, SITE_URL);
	const headers = new Headers(accept === undefined ? {} : { accept });
	const event = { request: new Request(url, { method, headers }), url, isDataRequest } as unknown as RequestEvent;
	const resolve = vi.fn(async () => new Response('<!doctype html><p>app</p>', { status, headers: { 'content-type': 'text/html' } }));
	return { response: handle({ event, resolve }) as Promise<Response>, resolve };
}

const vary = (r: Response) => (r.headers.get('vary') ?? '').split(',').map((v) => v.trim());

describe('markdown content negotiation', () => {
	it('serves markdown for Accept: text/markdown with Vary: Accept', async () => {
		const { response, resolve } = run('/', { accept: 'text/markdown' });
		const res = await response;
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
		expect(vary(res)).toEqual(['Accept', 'Accept-Encoding']);
		expect(res.headers.get('link')).toBe(`<${SITE_URL}/>; rel="canonical"`);
		expect(await res.text()).toMatch(/^# Euan Ripper\n/);
		expect(resolve).not.toHaveBeenCalled();
	});

	it.each([undefined, '*/*', BROWSER, 'text/markdown, text/html', 'text/markdown;q=0.5, text/html'])(
		'serves the HTML page for Accept %j, with Vary and a markdown alternate',
		async (accept) => {
			const { response, resolve } = run('/', { accept });
			const res = await response;
			expect(resolve).toHaveBeenCalledOnce();
			expect(res.headers.get('content-type')).toBe('text/html');
			expect(vary(res)).toEqual(['Accept', 'Accept-Encoding']);
			expect(res.headers.get('link')).toContain(`<${SITE_URL}/index.md>; rel="alternate"; type="text/markdown"`);
		}
	);

	it('negotiates blog posts too', async () => {
		const res = await run('/blog/stickers', { accept: 'text/markdown' }).response;
		expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
		expect(await res.text()).toContain('# Stickers');
	});

	it('returns 406 listing the available types when nothing matches', async () => {
		const res = await run('/', { accept: 'application/pdf' }).response;
		expect(res.status).toBe(406);
		expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
		expect(vary(res)).toContain('Accept');
		const body = await res.text();
		expect(body).toContain('- text/html');
		expect(body).toContain('- text/markdown');
	});

	it('sends headers but no body for HEAD', async () => {
		const res = await run('/', { accept: 'text/markdown', method: 'HEAD' }).response;
		expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
		expect(res.body).toBeNull();
	});

	it('leaves non-GET and data requests alone', async () => {
		for (const opts of [{ method: 'POST' }, { isDataRequest: true }]) {
			const { response, resolve } = run('/', { accept: 'text/markdown', ...opts });
			const res = await response;
			expect(resolve).toHaveBeenCalledOnce();
			expect(res.headers.get('vary')).toBeNull();
		}
	});
});

describe('.md companion URLs', () => {
	it.each(['/index.md', '/index.html.md'])('%s serves the homepage as markdown', async (path) => {
		const res = await run(path, { accept: BROWSER }).response;
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
		expect(await res.text()).toMatch(/^# Euan Ripper\n/);
	});

	it('404s for an unknown companion', async () => {
		const res = await run('/blog/nope.md').response;
		expect(res.status).toBe(404);
		expect(await res.text()).toContain('# 404 Not Found');
	});
});

describe('404s', () => {
	it.each([undefined, '*/*', 'text/markdown', 'application/json'])(
		'answers Accept %j with a markdown 404 body',
		async (accept) => {
			const res = await run('/some-path-that-does-not-exist', { accept, status: 404 }).response;
			expect(res.status).toBe(404);
			expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
			expect(vary(res)).toContain('Accept');
			const body = await res.text();
			expect(body).toContain('`/some-path-that-does-not-exist`');
			expect(body).toContain(`${SITE_URL}/llms.txt`);
			expect(body).toContain(`${SITE_URL}/sitemap.xml`);
		}
	);

	it('keeps the HTML error page for browsers', async () => {
		const res = await run('/some-path-that-does-not-exist', { accept: BROWSER, status: 404 }).response;
		expect(res.status).toBe(404);
		expect(res.headers.get('content-type')).toBe('text/html');
		expect(vary(res)).toContain('Accept');
	});

	it('treats unknown blog slugs as missing pages', async () => {
		const { response, resolve } = run('/blog/not-a-post', { status: 404 });
		const res = await response;
		expect(resolve).toHaveBeenCalledOnce();
		expect(res.status).toBe(404);
		expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
	});

	it('passes other responses through untouched', async () => {
		const res = await run('/llms.txt').response;
		expect(res.status).toBe(200);
		expect(res.headers.get('vary')).toBeNull();
	});
});
