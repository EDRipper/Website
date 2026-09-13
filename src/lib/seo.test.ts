import { describe, expect, it } from 'vitest';
import { profile, SITE_URL } from './content';
import { HOME_DESCRIPTION, HOME_TITLE, homeJsonLd, jsonLdTag } from './seo';

describe('homepage metadata', () => {
	it('puts the name first in the title', () => {
		expect(HOME_TITLE.startsWith(profile.name)).toBe(true);
		expect(HOME_TITLE.length).toBeLessThanOrEqual(60);
	});

	it('has a description that fits a search snippet', () => {
		expect(HOME_DESCRIPTION).toContain(profile.name);
		expect(HOME_DESCRIPTION.length).toBeGreaterThanOrEqual(50);
		expect(HOME_DESCRIPTION.length).toBeLessThanOrEqual(160);
	});
});

describe('homeJsonLd', () => {
	const ld = homeJsonLd();
	const byType = (t: string) => ld['@graph'].find((n) => n['@type'] === t) as Record<string, any>;

	it('describes a Person with identity fields', () => {
		const person = byType('Person');
		expect(person).toMatchObject({
			name: 'Euan Ripper',
			givenName: 'Euan',
			familyName: 'Ripper',
			url: `${SITE_URL}/`,
			email: `mailto:${profile.email}`
		});
		expect(person.description).toBe(profile.summary);
		expect(person.image.url).toBe(`${SITE_URL}/images/euan.jpg`);
		expect(person.sameAs).toEqual(profile.socials.map((s) => s.url));
	});

	it('links the ProfilePage and WebSite to the Person', () => {
		const personId = byType('Person')['@id'];
		expect(byType('ProfilePage').mainEntity).toEqual({ '@id': personId });
		expect(byType('ProfilePage').isPartOf).toEqual({ '@id': byType('WebSite')['@id'] });
		expect(byType('WebSite').alternateName).toContain("Euan's Website");
	});
});

describe('jsonLdTag', () => {
	it('round-trips as JSON inside a ld+json script', () => {
		const tag = jsonLdTag(homeJsonLd());
		const m = /^<script type="application\/ld\+json">(.*)<\/script>$/s.exec(tag);
		expect(m).not.toBeNull();
		expect(JSON.parse(m![1])).toEqual(homeJsonLd());
	});

	it('escapes characters that could end the script element', () => {
		const nasty = '</script><script>alert(1)</script> & ' + String.fromCharCode(0x2028, 0x2029);
		const tag = jsonLdTag({ x: nasty });
		expect(tag.split('</script>')).toHaveLength(2); // only the closing tag
		expect(tag).not.toContain('&');
		expect(tag).not.toContain(String.fromCharCode(0x2028));
		expect(tag).not.toContain(String.fromCharCode(0x2029));
		expect(JSON.parse(tag.slice(tag.indexOf('>') + 1, -'</script>'.length)).x).toBe(nasty);
	});

	it('leaves ordinary spaces alone', () => {
		expect(jsonLdTag({ a: 'b c' })).toContain('"b c"');
	});
});
