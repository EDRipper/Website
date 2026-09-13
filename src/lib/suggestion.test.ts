import { describe, expect, it } from 'vitest';
import {
	SUGGESTION_LIMITS,
	cleanText,
	createRateLimiter,
	parseSuggestion,
	readLimited
} from './suggestion';

// Build invisible characters from their code points so none are pasted into this file.
const ch = (...cps: number[]) => String.fromCodePoint(...cps);

describe('cleanText', () => {
	it('keeps SQL- and HTML-looking input as plain text (it is only ever bound as a parameter)', () => {
		const nasty = `Robert'); DROP TABLE song_suggestions;-- <script>alert(1)</script>`;
		expect(cleanText(nasty, 200)).toBe(nasty);
	});

	it('removes null bytes and other control characters', () => {
		expect(cleanText(`Fade${ch(0)}Into${ch(7)}You${ch(0x9b)}`, 200)).toBe('Fade Into You');
	});

	it('removes zero-width, bidi override and byte-order-mark characters', () => {
		expect(cleanText(`a${ch(0x200b)}b${ch(0x202e)}c${ch(0x2066)}d${ch(0xfeff)}`, 200)).toBe('a b c d');
	});

	it('collapses whitespace and newlines to single spaces', () => {
		expect(cleanText('  Nobody\n\n\t—   Hozier  ', 200)).toBe('Nobody — Hozier');
	});

	it('caps length by character without splitting emoji', () => {
		const smile = ch(0x1f600);
		expect(cleanText(smile.repeat(3), 2)).toBe(smile.repeat(2));
		expect(Array.from(cleanText('x'.repeat(500), SUGGESTION_LIMITS.song))).toHaveLength(200);
	});

	it('returns empty text for non-strings', () => {
		expect(cleanText({ toString: () => 'sneaky' }, 200)).toBe('');
		expect(cleanText(42, 200)).toBe('');
	});
});

describe('parseSuggestion', () => {
	it('accepts a normal suggestion', () => {
		expect(parseSuggestion({ song: 'Vampire Empire — Big Thief', name: 'Sam', website: '' })).toEqual({
			ok: true,
			song: 'Vampire Empire — Big Thief',
			name: 'Sam',
			bot: false
		});
	});

	it.each([null, 'song', 42, ['song'], true])('rejects a body that is not an object: %j', (body) => {
		expect(parseSuggestion(body).ok).toBe(false);
	});

	it('rejects fields that are not text', () => {
		expect(parseSuggestion({ song: ['a', 'b'] }).ok).toBe(false);
		expect(parseSuggestion({ song: { $gt: '' } }).ok).toBe(false);
		expect(parseSuggestion({ song: 'ok', name: { first: 'x' } }).ok).toBe(false);
	});

	it('requires a song that is not blank once cleaned', () => {
		expect(parseSuggestion({ song: `   ${ch(0x200b)}  ` })).toEqual({ ok: false, error: 'song is required' });
	});

	it('treats a blank name as no name', () => {
		expect(parseSuggestion({ song: 'x', name: '   ' })).toMatchObject({ ok: true, name: null });
	});

	it('flags a filled honeypot as a bot', () => {
		expect(parseSuggestion({ song: 'x', website: 'http://spam.example' })).toMatchObject({ ok: true, bot: true });
	});
});

describe('readLimited', () => {
	const post = (body: string, headers: Record<string, string> = {}) =>
		new Request('http://localhost/api/suggest', { method: 'POST', body, headers });

	it('reads a small body', async () => {
		expect(await readLimited(post('{"song":"x"}'), 2_000)).toBe('{"song":"x"}');
	});

	it('refuses a body that is too large', async () => {
		expect(await readLimited(post('x'.repeat(3_000)), 2_000)).toBeNull();
	});

	it('refuses early when content-length already says it is too large', async () => {
		expect(await readLimited(post('x', { 'content-length': '999999' }), 2_000)).toBeNull();
	});
});

describe('createRateLimiter', () => {
	it('allows up to the limit per window, then blocks until the window passes', () => {
		const allow = createRateLimiter(2, 1_000);
		expect(allow('1.2.3.4', 0)).toBe(true);
		expect(allow('1.2.3.4', 10)).toBe(true);
		expect(allow('1.2.3.4', 20)).toBe(false);
		expect(allow('5.6.7.8', 20)).toBe(true); // other visitors are unaffected
		expect(allow('1.2.3.4', 1_005)).toBe(true);
	});
});
