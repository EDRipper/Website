import { json, error, type RequestHandler } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';
import { MAX_SUGGESTION_BYTES, createRateLimiter, parseSuggestion, readLimited } from '$lib/suggestion';

// Friends can recommend me a song. Input is validated and cleaned in $lib/suggestion,
// and reaches Postgres only as bound parameters (neon's tagged template sends values
// separately from the SQL text), so nothing a visitor types can alter the query.

const allow = createRateLimiter(5, 10 * 60_000); // 5 suggestions per visitor per 10 minutes

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
	// Only JSON, and only from this site's own pages.
	if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
		throw error(415, 'expected JSON');
	}
	const origin = request.headers.get('origin');
	if (origin && origin !== url.origin) throw error(403, 'cross-site request');

	const raw = await readLimited(request, MAX_SUGGESTION_BYTES);
	if (raw === null) throw error(413, 'too large');
	let body: unknown;
	try {
		body = JSON.parse(raw);
	} catch {
		throw error(400, 'invalid JSON');
	}
	const suggestion = parseSuggestion(body);
	if (!suggestion.ok) throw error(400, suggestion.error);
	// A filled honeypot means a bot: report success so it doesn't learn to avoid the field.
	if (suggestion.bot) return json({ ok: true });

	const ip = getClientAddress();
	if (!allow(ip)) throw error(429, 'too many suggestions, try again later');

	const connectionString = env.DATABASE_URL ?? env.POSTGRES_URL;
	if (!connectionString) throw error(500, 'database not configured');
	const sql = neon(connectionString);
	await sql`
		create table if not exists song_suggestions (
			id bigint generated always as identity primary key,
			song text not null,
			name text,
			ip text,
			created_at timestamptz not null default now()
		)
	`;
	await sql`
		insert into song_suggestions (song, name, ip)
		values (${suggestion.song}, ${suggestion.name}, ${ip})
	`;

	return json({ ok: true });
};
