<script lang="ts">
	// Placeholder blog post page — real content to be written per slug later.
	import { page } from '$app/state';

	const title = $derived(
		(page.params.slug ?? '')
			.split('-')
			.map((w) => w[0].toUpperCase() + w.slice(1))
			.join(' ')
	);
</script>

<svelte:head>
	<title>Euan Ripper — {title}</title>
</svelte:head>

<main class="screen">
	<a class="back" href="/">‹ BACK TO MISSIONS</a>

	<article class="panel">
		<h1>{title}</h1>
		<p class="muted">ill write the blogs later :p</p>
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
	.back {
		text-decoration: none;
		color: inherit;
		font-size: 0.8rem;
	}
	.panel {
		border: 1px solid #ccc;
		padding: 1.5rem;
		max-width: 640px;
	}
	.panel h1 {
		margin: 0 0 0.75rem;
		font-size: 1.4rem;
	}
	.muted {
		margin: 0;
		font-size: 0.85rem;
		opacity: 0.6;
	}
</style>
