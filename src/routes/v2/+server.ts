import { redirect } from '@sveltejs/kit';

// The archived v2 build is a static snapshot under static/v2; /v2 itself isn't a file,
// so point it at the snapshot's index. See /versions.
export const GET = () => redirect(308, '/v2/index.html');
