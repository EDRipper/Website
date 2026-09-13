import type { RequestHandler } from '@sveltejs/kit';
import { llmsTxt } from '$lib/markdown';

export const GET: RequestHandler = () =>
	new Response(llmsTxt(), {
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' }
	});
