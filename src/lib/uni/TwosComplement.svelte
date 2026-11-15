<script lang="ts">
	// Interactive two's-complement explorer. Drag a value and watch an 8-bit
	// signed number build: true binary, first complement (invert), second
	// complement (+1). The thing everyone finds fiddly, done live.
	let n = $state(-39); // his worked example value

	const W = 8;
	const mag = $derived(Math.abs(n));
	// 8-bit patterns
	const bits = (v: number) => ((v % (1 << W)) + (1 << W)) % (1 << W);
	const toStr = (v: number) => v.toString(2).padStart(W, '0');

	const trueBinary = $derived(toStr(mag)); // magnitude in 8 bits
	const firstComp = $derived(
		trueBinary
			.split('')
			.map((b) => (b === '1' ? '0' : '1'))
			.join('')
	);
	const secondComp = $derived(toStr(bits(parseInt(firstComp, 2) + 1)));
	// the actual stored pattern for n (two's complement)
	const stored = $derived(toStr(bits(n)));
	// signed-magnitude: MSB = sign, rest = magnitude
	const signedMag = $derived((n < 0 ? '1' : '0') + toStr(mag).slice(1));
</script>

<div class="tc">
	<div class="controls">
		<label for="n">value <b>n = {n}</b></label>
		<input id="n" type="range" min="-128" max="127" step="1" bind:value={n} />
		<p class="hint">
			range of an 8-bit two's complement number is <b>&minus;128 to +127</b> (that is
			&minus;2&#8311; to 2&#8311;&minus;1 - one extra on the negative side, which is why there is a
			&minus;128 but no +128).
		</p>
	</div>

	<div class="rows">
		{#if n >= 0}
			<div class="row"><span class="k">8-bit pattern</span><span class="b pos">{stored}</span></div>
			<p class="note">positive, so the two's complement is just the plain binary.</p>
		{:else}
			<div class="row"><span class="k">1. true binary of {mag}</span><span class="b">{trueBinary}</span></div>
			<div class="row"><span class="k">2. first complement (invert)</span><span class="b">{firstComp}</span></div>
			<div class="row"><span class="k">3. second complement (+1)</span><span class="b neg">{secondComp}</span></div>
			<p class="note">step 3 is the stored pattern for <b>{n}</b>. signed-magnitude form would instead be <span class="mono">{signedMag}</span> (just flip the top bit) - a different, less-used system.</p>
		{/if}
	</div>
</div>

<style>
	.tc {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 22px;
		align-items: start;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 20px 22px;
		box-shadow: var(--shadow);
		margin: 24px 0;
	}
	@media (max-width: 720px) {
		.tc {
			grid-template-columns: 1fr;
		}
	}
	.controls label {
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		display: block;
		margin-bottom: 8px;
	}
	input[type='range'] {
		width: 100%;
		accent-color: var(--accent);
		margin-bottom: 12px;
	}
	.hint {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: var(--muted);
		margin: 0;
		line-height: 1.5;
	}
	.rows {
		font-family: 'JetBrains Mono', monospace;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		padding: 5px 0;
		border-bottom: 1px dashed var(--line);
	}
	.k {
		font-size: 12.5px;
		color: var(--muted);
	}
	.b {
		font-size: 17px;
		letter-spacing: 2px;
		font-weight: 600;
		color: var(--ink);
	}
	.b.neg {
		color: var(--flag);
	}
	.b.pos {
		color: var(--good);
	}
	.note {
		font-family: 'Inter', sans-serif;
		font-size: 12.5px;
		color: var(--muted);
		margin: 12px 0 0;
		line-height: 1.5;
	}
	.mono {
		font-family: 'JetBrains Mono', monospace;
		letter-spacing: 1px;
		color: var(--ink);
	}
</style>
