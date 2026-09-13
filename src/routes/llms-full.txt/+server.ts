import type { RequestHandler } from '@sveltejs/kit';
import { homeMarkdown } from '$lib/markdown';

export const GET: RequestHandler = () =>
	new Response(homeMarkdown(), {
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' }
	});
