import { redirect } from '@sveltejs/kit';

// The archived v1 build is a static snapshot under static/v1; /v1 itself isn't a file,
// so point it at the snapshot's index. See /versions.
export const GET = () => redirect(308, '/v1/index.html');
