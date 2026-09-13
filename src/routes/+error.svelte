<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/Seo.svelte';
</script>

<Seo title="{page.status} — Euan Ripper" description="This page doesn't exist on Euan Ripper's website." noindex />

<main class="screen">
	<a class="back" href="/">‹ BACK TO HOME</a>

	<article class="panel">
		<h1>{page.status} {page.error?.message}</h1>
		{#if page.status === 404}
			<p>There's nothing at <code>{page.url.pathname}</code>. Try one of these instead:</p>
			<ul>
				<li><a href="/">Homepage</a> — who Euan Ripper is, his story and projects</li>
				<li><a href="/llms.txt">llms.txt</a> — a guide to this site for AI agents</li>
				<li><a href="/sitemap.xml">Sitemap</a> — every indexable page</li>
			</ul>
		{/if}
	</article>
</main>

<style>
	.screen {
		min-height: 100vh;
		box-sizing: border-box;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		font-family: 'Departure Mono', ui-monospace, monospace;
	}
	.back,
	.panel a {
		color: inherit;
	}
	.back {
		text-decoration: none;
		font-size: 0.8rem;
	}
	.panel {
		border: 1px solid #ccc;
		padding: 1.5rem;
		max-width: 640px;
		font-size: 0.85rem;
		line-height: 1.6;
	}
	.panel h1 {
		margin: 0 0 0.75rem;
		font-size: 1.4rem;
	}
	.panel ul {
		margin: 0;
		padding-left: 1.2rem;
	}
</style>
