import { describe, expect, it } from 'vitest';
import { posts, profile, SITE_URL } from './content';
import {
	homeMarkdown,
	llmsTxt,
	markdownFor,
	markdownUrl,
	notFoundMarkdown,
	pagePathForMarkdownUrl,
	postMarkdown
} from './markdown';

describe('markdown URLs', () => {
	it('maps pages to .md companions', () => {
		expect(markdownUrl('/')).toBe(`${SITE_URL}/index.md`);
		expect(markdownUrl('/blog/stickers')).toBe(`${SITE_URL}/blog/stickers.md`);
	});

	it.each([
		['/index.md', '/'],
		['/index.html.md', '/'],
		['/blog/stickers.md', '/blog/stickers'],
		['/blog/stickers/index.md', '/blog/stickers'],
		['/', null],
		['/llms.txt', null]
	])('%s → %s', (pathname, expected) => {
		expect(pagePathForMarkdownUrl(pathname)).toBe(expected);
	});

	it('resolves only real pages', () => {
		expect(markdownFor('/')).toBe(homeMarkdown());
		expect(markdownFor('/blog/stickers')).toContain('# Stickers');
		expect(markdownFor('/blog/not-a-post')).toBeNull();
		expect(markdownFor('/blog/stickers/extra')).toBeNull();
		expect(markdownFor('/nope')).toBeNull();
	});
});

describe('homeMarkdown', () => {
	const md = homeMarkdown();

	it('leads with the name and summary', () => {
		expect(md.startsWith(`# ${profile.name}\n\n> ${profile.summary}\n`)).toBe(true);
	});

	it('covers the story, every post, contact and profiles', () => {
		for (const p of posts) expect(md).toContain(`### ${p.title}`);
		expect(md).toContain('Loughborough');
		expect(md).toContain(`mailto:${profile.email}`);
		for (const s of profile.socials) expect(md).toContain(s.url);
	});

	it('has exactly one H1', () => {
		expect(md.match(/^# /gm)).toHaveLength(1);
	});
});

describe('postMarkdown', () => {
	it('describes an unpublished post and links back to the profile', () => {
		const md = postMarkdown(posts[0]);
		expect(md).toContain(`# ${posts[0].title}`);
		expect(md).toContain(`> ${posts[0].brief}`);
		expect(md).toContain("hasn't been published yet");
		expect(md).toContain(markdownUrl('/'));
	});
});

describe('notFoundMarkdown', () => {
	it('names the path and points to recovery links', () => {
		const md = notFoundMarkdown('/missing');
		expect(md).toMatch(/^# 404 Not Found/);
		expect(md).toContain('`/missing`');
		for (const url of [`${SITE_URL}/`, `${SITE_URL}/llms.txt`, `${SITE_URL}/sitemap.xml`]) {
			expect(md).toContain(`(${url})`);
		}
	});

	it('cannot break out of the inline code span', () => {
		expect(notFoundMarkdown('/a`b')).toContain('`/a%60b`');
	});
});

describe('llms.txt (llmstxt.org format)', () => {
	const txt = llmsTxt();
	const lines = txt.split('\n');
	const firstH2 = lines.findIndex((l) => l.startsWith('## '));

	it('starts with an H1 then a blockquote summary', () => {
		expect(lines[0]).toBe(`# ${profile.name}`);
		expect(lines[1]).toBe('');
		expect(lines[2]).toMatch(/^> .+/);
	});

	it('has no headings in the free-form details before the file lists', () => {
		expect(lines.slice(1, firstH2).some((l) => /^#{1,6} /.test(l))).toBe(false);
		expect(txt.match(/^# /gm)).toHaveLength(1);
	});

	it('only has link-list items ("- [name](url): notes") under H2 sections', () => {
		for (const line of lines.slice(firstH2)) {
			if (!line || line.startsWith('## ')) continue;
			expect(line).toMatch(/^- \[[^\]]+\]\([^)\s]+\)(: .+)?$/);
		}
	});

	it('has a "When to use" section and an Optional section last', () => {
		const h2s = lines.filter((l) => l.startsWith('## '));
		expect(h2s).toContain('## When to use');
		expect(h2s.at(-1)).toBe('## Optional');
	});

	it('tells agents how to get markdown and links every post', () => {
		expect(txt).toContain('Accept: text/markdown');
		for (const p of posts) expect(txt).toContain(`(${markdownUrl(`/blog/${p.slug}`)})`);
	});
});
