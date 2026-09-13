import type { RequestHandler } from '@sveltejs/kit';
import { robotsTxt } from '$lib/discovery';

export const GET: RequestHandler = () =>
	new Response(robotsTxt(), {
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' }
	});
