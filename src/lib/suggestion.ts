// Validation for the song suggestion form (POST /api/suggest). Everything a visitor
// sends is untrusted: it's checked and cleaned here, and the route only ever hands it to
// Postgres as bound query parameters, so no value can change the SQL itself.

export const SUGGESTION_LIMITS = { song: 200, name: 80 } as const;
export const MAX_SUGGESTION_BYTES = 2_000; // a real suggestion is a few hundred bytes at most

// Control characters (a null byte makes Postgres reject the text), zero-width characters,
// and bidi overrides/isolates that could make stored text read differently than it is.
const isUnsafe = (cp: number) =>
	cp <= 0x1f ||
	(cp >= 0x7f && cp <= 0x9f) ||
	(cp >= 0x200b && cp <= 0x200f) ||
	(cp >= 0x202a && cp <= 0x202e) ||
	(cp >= 0x2060 && cp <= 0x206f) ||
	cp === 0xfeff;

/** Plain single-line text: unsafe characters removed, whitespace collapsed, capped at `max` characters. */
export function cleanText(value: unknown, max: number): string {
	if (typeof value !== 'string') return '';
	const chars = Array.from(value.normalize('NFC'), (ch) => (isUnsafe(ch.codePointAt(0)!) ? ' ' : ch));
	const text = chars.join('').replace(/\s+/g, ' ').trim();
	return Array.from(text).slice(0, max).join('').trim(); // by code point, so emoji aren't split
}

export type ParsedSuggestion =
	| { ok: true; song: string; name: string | null; bot: boolean }
	| { ok: false; error: string };

/** Check the JSON body's shape and clean its fields. `bot` is set when the honeypot was filled. */
export function parseSuggestion(body: unknown): ParsedSuggestion {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		return { ok: false, error: 'invalid body' };
	}
	const { song, name, website } = body as Record<string, unknown>;
	if (typeof song !== 'string') return { ok: false, error: 'song must be text' };
	if (name != null && typeof name !== 'string') return { ok: false, error: 'name must be text' };
	const cleanSong = cleanText(song, SUGGESTION_LIMITS.song);
	if (!cleanSong) return { ok: false, error: 'song is required' };
	return {
		ok: true,
		song: cleanSong,
		name: cleanText(name, SUGGESTION_LIMITS.name) || null,
		bot: website != null && String(website).trim() !== ''
	};
}

/** Read a request body as text, giving up (null) once it passes `maxBytes`. */
export async function readLimited(request: Request, maxBytes: number): Promise<string | null> {
	const declared = Number(request.headers.get('content-length'));
	if (declared > maxBytes) return null;
	if (!request.body) return '';
	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > maxBytes) {
			await reader.cancel();
			return null;
		}
		chunks.push(value);
	}
	const bytes = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return new TextDecoder().decode(bytes);
}

/**
 * A small in-memory limiter: at most `limit` hits per key in any `windowMs`. It lives per
 * server instance, so it slows down spam rather than guaranteeing a hard cap.
 */
export function createRateLimiter(limit: number, windowMs: number) {
	const hits = new Map<string, number[]>();
	return (key: string, now = Date.now()): boolean => {
		const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
		if (recent.length >= limit) {
			hits.set(key, recent);
			return false;
		}
		recent.push(now);
		hits.set(key, recent);
		if (hits.size > 5_000) {
			// Forget keys with nothing recent so the map can't grow without bound.
			for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
		}
		return true;
	};
}
