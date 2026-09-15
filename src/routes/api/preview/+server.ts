import { json, error, type RequestHandler } from '@sveltejs/kit';

// Resolves a 30s preview clip for a song via the iTunes Search API (free, no
// key). Proxied through the server because itunes.apple.com sends no CORS
// headers, and so the lookups can be cached instead of hit once per hover.
type Hit = { previewUrl?: string; trackName?: string; artistName?: string };

const DAY = 86_400_000;
const MISS = 10 * 60_000; // "no clip" is remembered only briefly, in case it was a bad match
const cache = new Map<string, { url: string | null; at: number }>();

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

export const GET: RequestHandler = async ({ url, fetch }) => {
	const title = (url.searchParams.get('title') ?? '').trim().slice(0, 120);
	const artist = (url.searchParams.get('artist') ?? '').trim().slice(0, 120);
	if (!title) throw error(400, 'title is required');

	const key = `${norm(title)}|${norm(artist)}`;
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < (hit.url ? DAY : MISS)) return json({ url: hit.url });

	let previewUrl: string | null = null;
	try {
		const search = new URL('https://itunes.apple.com/search');
		search.searchParams.set('term', `${title} ${artist}`.trim());
		search.searchParams.set('media', 'music');
		search.searchParams.set('entity', 'song');
		search.searchParams.set('limit', '10');
		const res = await fetch(search, { headers: { accept: 'application/json' } });
		if (!res.ok) throw new Error(`iTunes HTTP ${res.status}`); // rate limited, usually
		// The API sometimes answers with text/javascript, so parse by hand.
		const { results = [] } = JSON.parse(await res.text()) as { results?: Hit[] };
		const playable = results.filter((r) => r.previewUrl);
		// Prefer a result where both the title and artist actually match;
		// fall back to the first playable hit.
		const best =
			playable.find(
				(r) =>
					norm(r.trackName ?? '').includes(norm(title)) &&
					(!artist || norm(r.artistName ?? '').includes(norm(artist)))
			) ??
			playable.find((r) => !artist || norm(r.artistName ?? '').includes(norm(artist))) ??
			playable[0];
		previewUrl = best?.previewUrl ?? null;
	} catch (err) {
		// The lookup itself failed, which is not the same as the song having no clip: say so
		// rather than answering "no clip", and don't remember it, so the next tap tries again
		// instead of the song being greyed out for good.
		console.warn('[preview] lookup failed:', title, artist, err);
		throw error(502, 'preview lookup failed');
	}

	cache.set(key, { url: previewUrl, at: Date.now() });
	return json(
		{ url: previewUrl },
		// Let the browser/CDN keep a found clip too — those never move. A miss is held briefly.
		{
			headers: {
				'cache-control': previewUrl ? 'public, max-age=3600, s-maxage=86400' : 'public, max-age=60'
			}
		}
	);
};
