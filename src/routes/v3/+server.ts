import { redirect } from '@sveltejs/kit';

// The archived v3 build is a static snapshot under static/v3; /v3 itself isn't a file,
// so point it at the snapshot's index. See /versions.
export const GET = () => redirect(308, '/v3/index.html');
