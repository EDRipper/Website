<script lang="ts">
	import { modules } from '$lib/uni/modules';
</script>

<svelte:head><title>uni - study notes & demos</title></svelte:head>

<main class="wrap">
	<header>
		<p class="kicker">Loughborough &middot; first year engineering</p>
		<h1>Study notes &amp; interactive demos</h1>
		<p class="lede">
			One page per module, built from the lecture recordings and the set textbooks. Worked examples
			stepped out, the theory the lecturer skipped filled back in, and the dynamic bits you can
			actually play with.
		</p>
	</header>

	<div class="grid">
		{#each modules as m}
			{#if m.status === 'live'}
				<a class="card live" href={`/uni/${m.slug}`} style={`--c:${m.accent}`}>
					<div class="code">{m.code}</div>
					<h2>{m.title}</h2>
					<p>{m.summary}</p>
					<div class="foot">
						<span class="count">{m.lessons.length} lessons</span>
						<span class="go">open &rarr;</span>
					</div>
				</a>
			{:else}
				<div class="card soon" style={`--c:${m.accent}`}>
					<div class="code">{m.code}</div>
					<h2>{m.title}</h2>
					<p>{m.summary}</p>
					<div class="foot"><span class="soon-tag">being built</span></div>
				</div>
			{/if}
		{/each}
	</div>
</main>

<style>
	.wrap {
		max-width: min(1280px, 93vw);
		margin: 0 auto;
		padding: 46px 24px 120px;
	}
	.kicker {
		font-family: 'Inter', sans-serif;
		font-size: 12.5px;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
		margin: 0;
	}
	h1 {
		font-size: 40px;
		line-height: 1.1;
		margin: 0.25em 0 0.3em;
		font-weight: 600;
		letter-spacing: -0.01em;
	}
	.lede {
		font-size: 19px;
		color: #4a453c;
		max-width: 62ch;
		margin: 0 0 32px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
		gap: 20px;
	}
	.card {
		display: block;
		background: var(--card);
		border: 1px solid var(--line);
		border-top: 3px solid var(--c);
		border-radius: 14px;
		padding: 20px 22px;
		box-shadow: var(--shadow);
		text-decoration: none;
		color: var(--ink);
		transition: transform 0.12s ease, box-shadow 0.12s ease;
	}
	.card.live:hover {
		transform: translateY(-2px);
		box-shadow: 0 2px 4px rgba(40, 34, 24, 0.08), 0 14px 30px rgba(40, 34, 24, 0.08);
	}
	.card.soon {
		opacity: 0.72;
	}
	.code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12.5px;
		font-weight: 600;
		color: var(--c);
		letter-spacing: 0.04em;
	}
	.card h2 {
		font-family: 'Inter', sans-serif;
		font-size: 20px;
		font-weight: 600;
		margin: 6px 0 8px;
	}
	.card p {
		font-size: 15.5px;
		color: var(--muted);
		margin: 0 0 18px;
		line-height: 1.5;
	}
	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
	}
	.count {
		color: var(--muted);
	}
	.go {
		color: var(--c);
		font-weight: 600;
	}
	.soon-tag {
		color: var(--muted);
		font-size: 12px;
		font-style: italic;
	}
</style>
