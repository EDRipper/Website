<script lang="ts">
	// Coefficient of restitution: a ball dropped from height h rebounds to e squared times h.
	// Slide e and watch the bounce height (and the energy kept) change.
	let e = $state(0.75);

	let kept = $derived(e * e); // fraction of drop height recovered = fraction of energy kept
	const floorY = 220;
	const topY = 40;
	const dropPx = floorY - topY; // 180
	let reboundY = $derived(floorY - dropPx * kept);
	// drop, bounce up to reboundY, fall back - looped
	let vals = $derived(`${topY};${floorY};${reboundY};${floorY}`);
	const pct = (n: number) => Math.round(n * 100);
</script>

<div class="rd">
	<svg viewBox="0 0 220 260" aria-label="bouncing ball restitution">
		<!-- drop height marker -->
		<line x1="40" y1={topY} x2="200" y2={topY} stroke="#6a645a" stroke-dasharray="4 4" stroke-width="1" />
		<text x="44" y={topY - 5} font-size="11" fill="#6a645a">drop height h</text>
		<!-- rebound marker -->
		<line x1="40" y1={reboundY} x2="200" y2={reboundY} stroke="#0e6b63" stroke-dasharray="4 4" stroke-width="1.3" />
		<text x="44" y={reboundY - 5} font-size="11" fill="#0e6b63">rebound = {pct(kept)}% of h</text>
		<!-- floor -->
		<line x1="30" y1={floorY} x2="200" y2={floorY} stroke="#201d18" stroke-width="2.5" />
		<!-- ball -->
		<circle cx="120" r="12" fill="#b5631f">
			<animate attributeName="cy" dur="1.8s" repeatCount="indefinite" values={vals} keyTimes="0;0.4;0.72;1" calcMode="spline" keySplines="0.4 0 1 1; 0 0 0.4 1; 0.4 0 1 1" />
		</circle>
	</svg>

	<div class="panel">
		<label>coefficient of restitution e = <b>{e.toFixed(2)}</b>
			<input type="range" min="0" max="1" step="0.01" bind:value={e} />
		</label>
		<div class="readout">
			<div><span class="k">rebound height</span><code>h' = e&sup2; h = {kept.toFixed(2)} h</code></div>
			<div><span class="k">energy kept</span><code>{pct(kept)}%</code></div>
			<div><span class="k">energy lost</span><code>{pct(1 - kept)}% (vibration, sound, heat, deformation)</code></div>
		</div>
		<p class="note">
			e = 1 is a perfect bounce (no loss) and e = 0 is dead (no bounce). Real equipment lives in
			between - a "lively" hurling ball sits high, a crash helmet's foam is deliberately near zero so it
			keeps the energy instead of returning it to your head.
		</p>
	</div>
</div>

<style>
	.rd {
		display: grid;
		grid-template-columns: 220px 1fr;
		gap: 22px;
		align-items: center;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 20px 22px;
		box-shadow: var(--shadow);
		margin: 24px 0;
	}
	@media (max-width: 640px) {
		.rd {
			grid-template-columns: 1fr;
		}
	}
	svg {
		width: 100%;
		height: auto;
		font-family: 'Inter', sans-serif;
	}
	.panel {
		font-family: 'Inter', sans-serif;
	}
	.panel label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 14px;
		margin-bottom: 14px;
	}
	input[type='range'] {
		accent-color: var(--accent);
	}
	.readout {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}
	.readout div {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 10px;
		align-items: baseline;
	}
	.readout .k {
		font-size: 12px;
		color: var(--muted);
	}
	.readout code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13.5px;
	}
	.note {
		font-size: 13px;
		color: var(--muted);
		line-height: 1.5;
		margin: 14px 0 0;
	}
</style>
