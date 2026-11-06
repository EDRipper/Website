import { redirect } from '@sveltejs/kit';

// /cv opens the real CV document (static/cv.pdf) full-page in the browser's
// native PDF viewer, rather than a themed HTML page.
export const prerender = false;
export const GET = () => redirect(308, '/cv.pdf');
