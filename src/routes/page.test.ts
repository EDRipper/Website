import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { SITE_URL } from '$lib/content';
import { HOME_DESCRIPTION, HOME_TITLE } from '$lib/seo';
import Home from './+page.svelte';
import Post from './blog/[slug]/+page.svelte';
import { posts } from '$lib/content';

describe('homepage SSR', () => {
	const { head, body } = render(Home);

	it('renders the SEO head', () => {
		expect(head).toContain(`<title>${HOME_TITLE.replace('&', '&amp;')}</title>`);
		expect(head).toContain(`<meta name="description" content="${HOME_DESCRIPTION}"`);
		expect(head).toContain(`<link rel="canonical" href="${SITE_URL}/"`);
		expect(head).toContain(`<link rel="alternate" type="text/markdown" href="${SITE_URL}/index.md"`);
		expect(head).toContain('<meta property="og:type" content="profile"');
		expect(head).not.toContain('name="robots"');
	});

	it('embeds parseable JSON-LD for a Person', () => {
		const m = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(head);
		expect(m).not.toBeNull();
		const ld = JSON.parse(m![1]);
		expect(ld['@graph'].find((n: { '@type': string }) => n['@type'] === 'Person').name).toBe('Euan Ripper');
	});

	it('makes the name the only h1, and still renders the content from $lib/content', () => {
		expect(body.match(/<h1[\s>]/g)).toHaveLength(1);
		expect(body).toMatch(/<h1 class="hero-name[^"]*">Euan Ripper<\/h1>/);
		expect(body).toContain('Welcome');
		expect(body).toContain('Hack Club Fellowship');
		expect(body).toContain('Speak at the European Parliament in Strasbourg');
		expect(body).toContain('Started programming at 16');
		expect(body).toContain('Banana Pancakes');
	});
});

describe('blog post SSR', () => {
	it('noindexes placeholder posts and uses the real title', () => {
		const post = posts.find((p) => p.slug === 'hike-55-miles-british-army')!;
		const { head, body } = render(Post, { props: { data: { post }, params: { slug: post.slug } } as never });
		expect(head).toContain(`<title>Euan Ripper — ${post.title}</title>`);
		expect(head).toContain('<meta name="robots" content="noindex"');
		expect(head).not.toContain('rel="canonical"');
		expect(body).toContain(`>${post.title}</h1>`); // h1 carries a scoped class
	});
});
