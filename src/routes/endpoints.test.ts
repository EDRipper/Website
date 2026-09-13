import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { robotsTxt, sitemapXml } from '$lib/discovery';
import { homeMarkdown, llmsTxt } from '$lib/markdown';
import { GET as llms } from './llms.txt/+server';
import { GET as llmsFull } from './llms-full.txt/+server';
import { GET as robots } from './robots.txt/+server';
import { GET as sitemap } from './sitemap.xml/+server';

const call = (handler: typeof llms) => handler({} as RequestEvent) as Response;

describe('machine-readable endpoints', () => {
	it.each([
		['/llms.txt', llms, 'text/plain; charset=utf-8', llmsTxt()],
		['/llms-full.txt', llmsFull, 'text/plain; charset=utf-8', homeMarkdown()],
		['/robots.txt', robots, 'text/plain; charset=utf-8', robotsTxt()],
		['/sitemap.xml', sitemap, 'application/xml; charset=utf-8', sitemapXml()]
	])('%s', async (_path, handler, type, body) => {
		const res = call(handler);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe(type);
		expect(res.headers.get('cache-control')).toBe('public, max-age=3600');
		expect(await res.text()).toBe(body);
	});
});
