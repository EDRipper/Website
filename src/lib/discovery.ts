// robots.txt (RFC 9309) and sitemap.xml (https://www.sitemaps.org/protocol.html).
import { absolute, posts } from './content';

/**
 * Pages worth indexing: the homepage plus any blog post that's actually written.
 * /recs (the list of visitors' song recommendations) is intentionally public but
 * deliberately left out of the sitemap; it's reachable only by its link.
 */
export const indexablePaths = () => ['/', ...posts.filter((p) => p.published).map((p) => `/blog/${p.slug}`)];

const xmlEscape = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function sitemapXml(): string {
	const urls = indexablePaths()
		.map((p) => `\t<url>\n\t\t<loc>${xmlEscape(absolute(p))}</loc>\n\t</url>`)
		.join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(): string {
	return [
		'# Search engines and AI agents are welcome. For agents: see /llms.txt',
		'User-agent: *',
		'Allow: /',
		'Disallow: /api/',
		'',
		`Sitemap: ${absolute('/sitemap.xml')}`,
		''
	].join('\n');
}
