<script lang="ts">
	import DitherButterflies from '$lib/DitherButterflies.svelte';

	// Defaults match the root page.
	let dark = $state(true);
	let opacity = $state(0.08);
	let count = $state(9);
	let size = $state(16);
	let speed = $state(1);
	let flapRate = $state(1);
	let halo = $state(0.45);
	let trail = $state(0.5);
	let invert = $state(false);
	let clearWidth = $state(1080);
	let fade = $state(220);
	let push = $state(0.6);
	let clearFloor = $state(0.15);
	let showPanel = $state(true);

	// Put the body's theme class back how we found it when leaving this page.
	$effect(() => {
		const hadDark = document.body.classList.contains('dark');
		return () => document.body.classList.toggle('dark', hadDark);
	});
	$effect(() => {
		document.body.classList.toggle('dark', dark);
	});
</script>

<svelte:head>
	<title>dither test</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<DitherButterflies {dark} {opacity} {count} {size} {speed} {flapRate} {halo} {trail} {invert} {clearWidth} {fade} {push} {clearFloor} />

{#if showPanel}
	<div class="panel">
		<label class="check">
			<input type="checkbox" bind:checked={dark} /> dark mode
		</label>
		<label>
			<span class="row">opacity <b>{opacity.toFixed(2)}</b></span>
			<input type="range" min="0.05" max="1" step="0.01" bind:value={opacity} />
		</label>
		<label>
			<span class="row">butterflies <b>{count}</b></span>
			<input type="range" min="0" max="40" step="1" bind:value={count} />
		</label>
		<label>
			<span class="row">size <b>{size}</b></span>
			<input type="range" min="6" max="40" step="1" bind:value={size} />
		</label>
		<label>
			<span class="row">speed <b>{speed.toFixed(1)}x</b></span>
			<input type="range" min="0" max="4" step="0.1" bind:value={speed} />
		</label>
		<label>
			<span class="row">flap <b>{flapRate.toFixed(1)}x</b></span>
			<input type="range" min="0" max="4" step="0.1" bind:value={flapRate} />
		</label>
		<label>
			<span class="row">halo <b>{halo.toFixed(2)}</b></span>
			<input type="range" min="0" max="1" step="0.01" bind:value={halo} />
		</label>
		<label>
			<span class="row">trail <b>{trail.toFixed(2)}</b></span>
			<input type="range" min="0" max="1" step="0.01" bind:value={trail} />
		</label>
		<label>
			<span class="row">clear width <b>{clearWidth}px</b></span>
			<input type="range" min="0" max="1800" step="10" bind:value={clearWidth} />
		</label>
		<label>
			<span class="row">fade <b>{fade}px</b></span>
			<input type="range" min="0" max="600" step="10" bind:value={fade} />
		</label>
		<label>
			<span class="row">centre dither <b>{clearFloor.toFixed(2)}</b></span>
			<input type="range" min="0" max="1" step="0.01" bind:value={clearFloor} />
		</label>
		<label>
			<span class="row">cursor push <b>{push.toFixed(1)}</b></span>
			<input type="range" min="0" max="3" step="0.1" bind:value={push} />
		</label>
		<label class="check">
			<input type="checkbox" bind:checked={invert} /> light butterflies
		</label>
		<button onclick={() => (showPanel = false)}>hide</button>
	</div>
{:else}
	<button class="show" onclick={() => (showPanel = true)}>controls</button>
{/if}

<style>
	:global(body) {
		background: #f0ede4;
		color: #1a1814;
	}
	:global(body.dark) {
		background: #131318;
		color: #ece7da;
	}

	.panel,
	.show {
		--panel: rgba(248, 245, 238, 0.9);
		--border: #8f8a7e;
		--accent: #1f9a3d;
		position: fixed;
		top: 16px;
		right: 16px;
		background: var(--panel);
		border: 2px solid var(--border);
		font-family: 'Departure Mono', monospace;
		font-size: 13px;
		color: inherit;
	}
	:global(body.dark) .panel,
	:global(body.dark) .show {
		--panel: rgba(30, 30, 38, 0.9);
		--border: #3a3a40;
		--accent: #39d353;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 12px 14px;
		width: 220px;
		max-height: calc(100vh - 32px);
		overflow-y: auto;
		box-sizing: border-box;
	}

	.panel label {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.row {
		display: flex;
		justify-content: space-between;
	}

	.row b {
		font-weight: normal;
		color: var(--accent);
	}

	.panel label.check {
		flex-direction: row;
		align-items: center;
		gap: 6px;
	}

	input {
		accent-color: var(--accent);
	}

	button {
		font: inherit;
		color: inherit;
		background: none;
		border: 2px solid var(--border);
		padding: 4px 8px;
		cursor: pointer;
	}

	.show {
		padding: 4px 10px;
	}
</style>
