import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

// /recs is intentionally public: a read-only list of the songs visitors recommend with
// the form on the homepage (POST /api/suggest). It only selects, and only the song, the
// name someone chose to give, and the date — never the IP stored alongside them. It's
// deliberately left out of the sitemap (see $lib/discovery).

export type Rec = { song: string; name: string | null; date: string; iso: string };

const day = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });

export const load: PageServerLoad = async ({ setHeaders }) => {
	const connectionString = env.DATABASE_URL ?? env.POSTGRES_URL;
	if (!connectionString) return { recs: [] as Rec[], unavailable: true };

	const sql = neon(connectionString);
	try {
		const rows = await sql`
			select song, name, created_at
			from song_suggestions
			order by created_at desc
			limit 500
		`;
		setHeaders({ 'cache-control': 'public, max-age=60' });
		const recs: Rec[] = rows.map((r) => {
			const at = new Date(r.created_at);
			return { song: String(r.song), name: r.name ? String(r.name) : null, date: day.format(at), iso: at.toISOString() };
		});
		return { recs, unavailable: false };
	} catch (err) {
		// The table is only created with the first suggestion, so none yet is just empty.
		if ((err as { code?: string }).code === '42P01') return { recs: [] as Rec[], unavailable: false };
		console.error('[recs] failed to load suggestions', err);
		return { recs: [] as Rec[], unavailable: true };
	}
};
