<script lang="ts">
	// Public, read-only list of the songs visitors have recommended (see +page.server.ts).
	import Seo from '$lib/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo
	title="Song recommendations · Euan Ripper"
	description="Every song visitors have recommended using the form on the homepage, newest first."
/>

<main class="recs">
	<a class="back" href="/">← back home</a>
	<h1>Song recommendations</h1>
	<p class="note">thanks gang &lt;3 this page is intentionally public</p>

	{#if data.unavailable}
		<p class="status">The recommendations can't be loaded right now. Try again in a bit.</p>
	{:else if data.recs.length === 0}
		<p class="status">No recommendations yet. <a href="/">Be the first!</a></p>
	{:else}
		<div class="table-wrap">
			<table>
				<caption>{data.recs.length} {data.recs.length === 1 ? 'recommendation' : 'recommendations'}</caption>
				<thead>
					<tr>
						<th scope="col">Song</th>
						<th scope="col">From</th>
						<th scope="col">Date</th>
					</tr>
				</thead>
				<tbody>
					{#each data.recs as rec, i (i)}
						<tr>
							<td class="song">{rec.song}</td>
							<td class="from">{rec.name ?? '—'}</td>
							<td class="date"><time datetime={rec.iso}>{rec.date}</time></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>

<style>
	/* Same light and dark palettes as the homepage (dark unless light mode was chosen). */
	:global(body) {
		background: #e3e8d3;
		color: #1b2417;
	}
	:global(body.dark) {
		background: #131318;
		color: #ece7da;
	}
	.recs {
		--line: #8c977a;
		--row: #cdd4bb;
		--green: #256b2a;
	}
	:global(body.dark) .recs {
		--line: #3a3a40;
		--row: #26262c;
		--green: #39d353;
	}
	.recs {
		max-width: 900px;
		margin: 0 auto;
		box-sizing: border-box;
		padding-block: 2.5rem 4rem;
		padding-inline: 1.25rem;
		font-family: 'Departure Mono', ui-monospace, monospace;
	}
	.back {
		display: inline-block;
		margin-bottom: 1.5rem;
		color: inherit;
		opacity: 0.75;
		font-size: 0.85rem;
		text-decoration: none;
	}
	.back:hover {
		opacity: 1;
		text-decoration: underline;
	}
	h1 {
		margin: 0 0 0.75rem;
		font-size: clamp(1.4rem, 4vw, 2rem);
		font-weight: normal;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
	.note {
		margin: 0 0 2rem;
		max-width: 65ch;
		font-size: 0.85rem;
		line-height: 1.6;
		opacity: 0.8;
	}
	.status {
		font-size: 0.9rem;
	}
	.status a {
		color: var(--green);
	}
	.table-wrap {
		overflow-x: auto;
		border: 2px solid var(--line);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}
	caption {
		caption-side: top;
		padding: 0.6rem 0.75rem;
		text-align: left;
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		opacity: 0.7;
		border-bottom: 2px solid var(--line);
	}
	th,
	td {
		padding: 0.55rem 0.75rem;
		text-align: left;
		vertical-align: top;
	}
	th {
		font-size: 0.72rem;
		font-weight: normal;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--green);
		border-bottom: 2px solid var(--line);
	}
	tbody tr + tr td {
		border-top: 1px solid var(--row);
	}
	.song {
		min-width: 14rem;
		overflow-wrap: anywhere;
	}
	.from {
		min-width: 6rem;
		overflow-wrap: anywhere;
		opacity: 0.85;
	}
	.date {
		white-space: nowrap;
		opacity: 0.7;
	}
</style>
