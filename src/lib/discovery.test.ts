import { describe, expect, it } from 'vitest';
import { SITE_URL } from './content';
import { indexablePaths, robotsTxt, sitemapXml } from './discovery';

describe('sitemap.xml', () => {
	const xml = sitemapXml();

	it('is a sitemaps.org urlset', () => {
		expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true);
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
	});

	it('lists absolute URLs for exactly the indexable pages', () => {
		const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
		expect(locs).toEqual(indexablePaths().map((p) => new URL(p, SITE_URL).href));
		expect(locs).toContain(`${SITE_URL}/`);
	});

	it('leaves unwritten placeholder posts out', () => {
		expect(indexablePaths().some((p) => p.startsWith('/blog/'))).toBe(false);
	});
});

describe('robots.txt', () => {
	const txt = robotsTxt();

	it('allows crawling and points at the sitemap', () => {
		expect(txt).toMatch(/^User-agent: \*$/m);
		expect(txt).toMatch(/^Allow: \/$/m);
		expect(txt).toMatch(new RegExp(`^Sitemap: ${SITE_URL}/sitemap\\.xml$`, 'm'));
	});

	it('keeps crawlers out of the API', () => {
		expect(txt).toMatch(/^Disallow: \/api\/$/m);
	});
});
