import { isHttpError } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { posts } from '$lib/content';
import { load } from './+page';

const run = (slug: string) => (load as (e: unknown) => unknown)({ params: { slug } });

describe('blog post load', () => {
	it('returns the post for a known slug', () => {
		expect(run('stickers')).toEqual({ post: posts.find((p) => p.slug === 'stickers') });
	});

	it('throws a real 404 for an unknown slug', () => {
		try {
			run('definitely-not-a-post');
			expect.unreachable();
		} catch (e) {
			expect(isHttpError(e, 404)).toBe(true);
		}
	});
});
