import { redirect } from '@sveltejs/kit';

// The archived v4 build is a static snapshot under static/v4; /v4 itself isn't a file,
// so point it at the snapshot's index. See /versions.
export const GET = () => redirect(308, '/v4/index.html');
