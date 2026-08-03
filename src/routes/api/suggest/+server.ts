import { json, error, type RequestHandler } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';

// Friends can recommend me a song or a book!
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const connectionString = env.DATABASE_URL ?? env.POSTGRES_URL;
	if (!connectionString) throw error(500, 'database not configured');

	let body: { song?: unknown; name?: unknown; website?: unknown };
	try {
		body = await request.json();
	} catch {
		throw error(400, 'invalid body');
	}

	const song = String(body.song ?? '').trim().slice(0, 200);
	const name = String(body.name ?? '').trim().slice(0, 80) || null;
	if (!song) throw error(400, 'song is required');

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
		values (${song}, ${name}, ${getClientAddress()})
	`;

	return json({ ok: true });
};
