import { redirect } from '@sveltejs/kit';

// The descent layout is the home page now; keep old links working.
export const GET = () => redirect(308, '/');
