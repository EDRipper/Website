import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { absolute, findPost, missions, posts, profile, sidequests, SITE_URL } from './content';

describe('content', () => {
	it('builds absolute URLs on the canonical origin', () => {
		expect(absolute('/')).toBe(`${SITE_URL}/`);
		expect(absolute('/blog/stickers')).toBe(`${SITE_URL}/blog/stickers`);
	});

	it('has a post for every /blog link on the homepage, with unique slugs', () => {
		const links = [...missions.map((m) => m.href), ...sidequests.map((q) => q.href)].filter((h) =>
			h?.startsWith('/blog/')
		);
		expect(posts).toHaveLength(links.length);
		expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
		for (const href of links) expect(findPost(href!.slice('/blog/'.length))).toBeDefined();
	});

	it('does not turn the open "New Mission" card into a post', () => {
		expect(posts.find((p) => p.title === 'New Mission')).toBeUndefined();
		expect(findPost('nope')).toBeUndefined();
	});

	it('lists the same social profiles the homepage links to', () => {
		const page = readFileSync('src/routes/+page.svelte', 'utf8');
		for (const s of profile.socials) expect(page).toContain(`href="${s.url}"`);
	});
});
