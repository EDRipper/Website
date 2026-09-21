<script lang="ts">
	// Renders each post's body paragraphs once written; falls back to a
	// placeholder otherwise. Unwritten posts are noindexed so search engines
	// don't list empty pages.
	import Seo from '$lib/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const post = $derived(data.post);
</script>

<Seo
	title="Euan Ripper — {post.title}"
	description={post.brief}
	path="/blog/{post.slug}"
	type="article"
	noindex={!post.published}
/>

<main class="screen">
	<a class="back" href="/">‹ BACK TO MISSIONS</a>

	<article class="panel">
		<h1>{post.title}</h1>
		{#if post.body}
			{#each post.body as paragraph}
				<p>{paragraph}</p>
			{/each}
		{:else}
			<p class="muted">ill write the blogs later :p</p>
		{/if}
	</article>
</main>

<style>
	.screen {
		width: 100%;
		max-width: 1000px; /* matches the homepage's centred content column */
		margin: 0 auto;
		min-height: 100vh;
		box-sizing: border-box;
		padding: 1.5rem 1.5rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		font-family: 'Departure Mono', ui-monospace, monospace;
	}
	.back {
		text-decoration: none;
		color: inherit;
		font-size: 0.8rem;
	}
	.panel {
		width: 100%;
		max-width: 70ch; /* broad reading measure, centred like the homepage's story panel */
		margin: 0 auto;
		border: 1px solid #ccc;
		padding: 1.5rem;
	}
	.panel h1 {
		margin: 0 0 1rem;
		font-size: 1.4rem;
	}
	.panel p {
		margin: 0 0 1rem;
		font-size: 0.85rem;
		line-height: 1.55;
	}
	.panel p:last-child {
		margin-bottom: 0;
	}
	.muted {
		opacity: 0.6;
	}
</style>
