// Search metadata and JSON-LD structured data (https://schema.org) for the homepage.
import { absolute, inventory, profile, SITE_URL } from './content';

export const HOME_TITLE = `${profile.name} — Maker & Hack Club Fellow`;
export const HOME_DESCRIPTION =
	'Euan Ripper is a maker from rural England and Hack Club fellow who runs hackathons for teens, builds Strandbeests and is off to study robotics at Loughborough.';

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function homeJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'ProfilePage',
				'@id': `${SITE_URL}/#profilepage`,
				url: absolute('/'),
				name: HOME_TITLE,
				description: HOME_DESCRIPTION,
				inLanguage: 'en',
				isPartOf: { '@id': WEBSITE_ID },
				about: { '@id': PERSON_ID },
				mainEntity: { '@id': PERSON_ID }
			},
			{
				'@type': 'WebSite',
				'@id': WEBSITE_ID,
				url: absolute('/'),
				name: profile.name,
				alternateName: ["Euan's Website", 'euans.life'],
				inLanguage: 'en',
				about: { '@id': PERSON_ID },
				publisher: { '@id': PERSON_ID }
			},
			{
				'@type': 'Person',
				'@id': PERSON_ID,
				name: profile.name,
				givenName: profile.givenName,
				familyName: profile.familyName,
				url: absolute('/'),
				description: profile.summary,
				image: {
					'@type': 'ImageObject',
					url: absolute(profile.image.src),
					width: profile.image.width,
					height: profile.image.height
				},
				email: `mailto:${profile.email}`,
				affiliation: { '@type': 'Organization', name: profile.affiliation.name, url: profile.affiliation.url },
				knowsAbout: [...profile.interests, ...inventory.map((t) => t.name)],
				sameAs: profile.socials.map((s) => s.url)
			}
		]
	};
}

// U+2028/U+2029 are valid in JSON but end lines in older JS parsers; built here so
// the characters never appear literally in this file.
const LINE_SEPARATORS = new RegExp('[' + String.fromCharCode(0x2028, 0x2029) + ']', 'g');

/** A JSON-LD <script> tag, escaped so no string value can close the tag early. */
export function jsonLdTag(data: unknown): string {
	const json = JSON.stringify(data)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(LINE_SEPARATORS, (c) => String.fromCharCode(92) + 'u' + c.charCodeAt(0).toString(16));
	return `<script type="application/ld+json">${json}</script>`;
}
