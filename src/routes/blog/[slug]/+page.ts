import { error } from '@sveltejs/kit';
import { findPost } from '$lib/content';
import type { PageLoad } from './$types';

// Only slugs linked from the homepage exist; anything else is a real 404.
export const load: PageLoad = ({ params }) => {
	const post = findPost(params.slug);
	if (!post) error(404, 'Not Found');
	return { post };
};
