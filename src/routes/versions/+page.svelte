<script lang="ts">
	// An archive of every pushed version. Each one is a real static build of the site as it
	// stood at that commit, living under static/vN, so they stay clickable rather than being
	// screenshots. See scripts/build-snapshot.md for how they're regenerated.
	const versions = [
		{
			tag: 'v4',
			date: '16 Sep 2026',
			sha: '852efa9',
			current: true,
			note: 'The descent becomes the home page: you open on the sky and scroll down through the treeline into the content. Adds a light mode on the moon, a finer-grained landscape on phones, and a StrandBeest that walks its own line.'
		},
		{
			tag: 'v3',
			date: '15 Sep 2026',
			sha: '5b843c9',
			note: 'The landscape arrives — parallax ridgelines and forest, a pitched tent and campfire in the footer, and butterflies that steer around the text instead of drifting over it.'
		},
		{
			tag: 'v2',
			date: '13 Sep 2026',
			sha: '8fb579c',
			note: 'The gamified layout: missions and sidequests as cards, reveal-on-scroll sections, and the dithered plasma behind the whole page.'
		}
	];
</script>

<svelte:head>
	<title>Versions</title>
	<meta name="description" content="Every pushed version of this site, kept live." />
</svelte:head>

<main>
	<h1>Versions</h1>
	<p class="intro">
		Every pushed version of this site, kept running. Each one is a real build from that commit —
		not a screenshot — so the canvas, the parallax and the butterflies all still work.
	</p>

	<ul>
		{#each versions as v (v.tag)}
			<li>
				<div class="head">
					<a class="tag" href="/{v.tag}/index.html">{v.tag}</a>
					{#if v.current}<span class="badge">current</span>{/if}
					<span class="date">{v.date}</span>
				</div>
				<p class="note">{v.note}</p>
				<p class="links">
					<a href="/{v.tag}/index.html">visit ↗</a>
					<a href="https://github.com/edripper/website/commit/{v.sha}" target="_blank" rel="noopener noreferrer">
						{v.sha} ↗
					</a>
				</p>
			</li>
		{/each}
	</ul>

	<p class="foot">
		Snapshots are the home page only — follow a link inside one and you'll land back on the live
		site. <a href="/">Back to now →</a>
	</p>
</main>

<style>
	/* The home page's palette is defined inside its own component styles, so it doesn't reach
	   this route: set the tokens locally, in both themes. */
	/* On the body, not on main: main is capped at 760px, so painting the background there
	   leaves the page's own ground showing down both sides. */
	:global(body) {
		--bg: #131318;
		--text: #ece7da;
		--border: #3a3a40;
		--dim: #8f8a7e;
		margin: 0;
		background: var(--bg);
		color: var(--text);
	}
	:global(body.light) {
		--bg: #f4f2ed;
		--text: #1d1d1f;
		--border: #bfb8ac;
		--dim: #6b6862;
	}
	main {
		box-sizing: border-box;
		max-width: 760px;
		margin: 0 auto;
		padding: 4rem 1.5rem 6rem;
		min-height: 100vh;
		font-family: 'Departure Mono', ui-monospace, monospace;
	}
	h1 {
		margin: 0 0 1rem;
		font-size: clamp(2.2rem, 6vw, 3.2rem);
		font-weight: normal;
		letter-spacing: 0.04em;
	}
	.intro {
		margin: 0 0 3rem;
		max-width: 60ch;
		line-height: 1.6;
		opacity: 0.85;
		text-wrap: pretty;
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}
	li {
		padding-top: 1.5rem;
		border-top: 2px solid var(--border);
	}
	.head {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	.tag {
		font-size: 1.6rem;
		color: inherit;
		text-decoration: none;
	}
	.tag:hover,
	.tag:focus-visible {
		text-decoration: underline;
	}
	.badge {
		padding: 0.1rem 0.5rem;
		border: 1px solid var(--border);
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dim);
	}
	.date {
		margin-left: auto;
		font-size: 0.85rem;
		color: var(--dim);
	}
	.note {
		margin: 0.75rem 0 1rem;
		max-width: 62ch;
		line-height: 1.6;
		text-wrap: pretty;
	}
	.links {
		margin: 0;
		display: flex;
		gap: 1.5rem;
		font-size: 0.9rem;
	}
	.links a {
		color: var(--dim);
	}
	.links a:hover,
	.links a:focus-visible {
		color: var(--text);
	}
	.foot {
		margin: 4rem 0 0;
		padding-top: 1.5rem;
		border-top: 2px solid var(--border);
		max-width: 62ch;
		line-height: 1.6;
		font-size: 0.9rem;
		color: var(--dim);
	}
	.foot a {
		color: var(--text);
	}
	@media (max-width: 560px) {
		main {
			padding-top: 2.5rem;
		}
		.date {
			margin-left: 0;
			width: 100%;
		}
	}
</style>
