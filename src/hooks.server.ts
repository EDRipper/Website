import type { Handle } from '@sveltejs/kit';
import { absolute } from '$lib/content';
import { markdownFor, markdownUrl, notFoundMarkdown, pagePathForMarkdownUrl } from '$lib/markdown';
import { negotiate, type MediaType } from '$lib/negotiate';

// Markdown for agents (https://acceptmarkdown.com): pages are served as HTML or
// markdown depending on Accept, every negotiated response says `Vary: Accept`
// so caches keep the variants apart, and missing pages get a markdown 404 that
// points somewhere useful.

const PAGE_OFFERS: MediaType[] = ['text/html', 'text/markdown'];
// Browsers always ask for text/html explicitly, so a missing page only falls back to
// markdown for agents and scripts (no Accept, */*, or text/markdown).
const NOT_FOUND_OFFERS: MediaType[] = ['text/markdown', 'text/html'];
const VARY = ['Accept', 'Accept-Encoding'];
const CACHE = 'public, max-age=0, must-revalidate'; // same as SvelteKit's HTML pages

function addVary(headers: Headers) {
	const have = (headers.get('vary') ?? '').split(',').map((v) => v.trim().toLowerCase());
	if (have.includes('*')) return;
	for (const v of VARY) if (!have.includes(v.toLowerCase())) headers.append('vary', v);
}

function markdown(body: string, method: string, { status = 200, canonical }: { status?: number; canonical?: string } = {}) {
	const headers = new Headers({ 'content-type': 'text/markdown; charset=utf-8', 'cache-control': CACHE });
	addVary(headers);
	if (canonical) headers.set('link', `<${canonical}>; rel="canonical"`);
	return new Response(method === 'HEAD' ? null : body, { status, headers });
}

function notAcceptable(accept: string, method: string) {
	const body = `406 Not Acceptable\n\nRequested: ${accept}\n\nThis resource is available in:\n${PAGE_OFFERS.map((t) => `- ${t}`).join('\n')}\n`;
	const headers = new Headers({
		'content-type': 'text/plain; charset=utf-8',
		'cache-control': CACHE,
		'x-content-type-options': 'nosniff'
	});
	addVary(headers);
	return new Response(method === 'HEAD' ? null : body, { status: 406, headers });
}

export const handle: Handle = async ({ event, resolve }) => {
	const { request, url } = event;
	const method = request.method;
	if ((method !== 'GET' && method !== 'HEAD') || event.isDataRequest) return resolve(event);
	const accept = request.headers.get('accept');

	// Fixed-format companion URLs: /index.md, /blog/<slug>.md.
	const companionOf = pagePathForMarkdownUrl(url.pathname);
	if (companionOf !== null) {
		const body = markdownFor(companionOf);
		return body === null
			? markdown(notFoundMarkdown(url.pathname), method, { status: 404 })
			: markdown(body, method, { canonical: absolute(companionOf) });
	}

	const body = markdownFor(url.pathname);
	if (body !== null) {
		const type = negotiate(accept, PAGE_OFFERS);
		if (type === null) return notAcceptable(accept ?? '', method);
		if (type === 'text/markdown') return markdown(body, method, { canonical: absolute(url.pathname) });
		const response = await resolve(event);
		addVary(response.headers);
		response.headers.append('link', `<${markdownUrl(url.pathname)}>; rel="alternate"; type="text/markdown"`);
		return response;
	}

	const response = await resolve(event);
	if (response.status === 404 && response.headers.get('content-type')?.startsWith('text/html')) {
		if (negotiate(accept, NOT_FOUND_OFFERS) !== 'text/html') {
			return markdown(notFoundMarkdown(url.pathname), method, { status: 404 });
		}
		addVary(response.headers);
	}
	return response;
};
