<script lang="ts">
	// Interactive decomposition of a tilted vector into its x and y parts.
	// Drag the slider for the tilt angle (measured from the vertical) and watch
	// the sine / cosine components update live. Answers "which axis gets sin?".
	let { magnitude = 18.75, label = 'M' }: { magnitude?: number; label?: string } = $props();

	let theta = $state(40); // degrees from the vertical (y-axis)

	const rad = (d: number) => (d * Math.PI) / 180;
	let xComp = $derived(magnitude * Math.sin(rad(theta))); // leans away from y -> sine
	let yComp = $derived(magnitude * Math.cos(rad(theta))); // leans toward y -> cosine

	// geometry: origin bottom-left, scale so the vector fits
	const ox = 90;
	const oy = 250;
	const len = 180;
	let tipX = $derived(ox + len * Math.sin(rad(theta)));
	let tipY = $derived(oy - len * Math.cos(rad(theta)));
	// arc from the y-axis to the vector
	let arc = $derived.by(() => {
		const r = 54;
		const ax = ox;
		const ay = oy - r;
		const bx = ox + r * Math.sin(rad(theta));
		const by = oy - r * Math.cos(rad(theta));
		return `M ${ax} ${ay} A ${r} ${r} 0 0 1 ${bx} ${by}`;
	});
</script>

<div class="demo">
	<div class="controls">
		<label for="th">tilt from vertical: <b>{theta}&deg;</b></label>
		<input id="th" type="range" min="0" max="90" step="1" bind:value={theta} />
		<div class="readout">
			<div><span class="x">x part</span> = {magnitude} &middot; sin {theta}&deg; = <b>{xComp.toFixed(2)}</b></div>
			<div><span class="y">y part</span> = {magnitude} &middot; cos {theta}&deg; = <b>{yComp.toFixed(2)}</b></div>
		</div>
		<p class="hint">
			slide to 0&deg; and the vector snaps onto y: the x part vanishes (that is why it is the
			<b>sine</b>), the y part becomes the whole thing (<b>cosine</b>).
		</p>
	</div>

	<svg viewBox="0 0 360 290" aria-label="interactive vector decomposition">
		<!-- axes -->
		<line x1={ox} y1={oy} x2="340" y2={oy} stroke="#201d18" stroke-width="1.5" marker-end="url(#vx)" />
		<line x1={ox} y1={oy} x2={ox} y2="30" stroke="#201d18" stroke-width="1.5" marker-end="url(#vy)" />
		<text x="344" y={oy + 5} font-size="13" fill="#6a645a" font-style="italic">x</text>
		<text x={ox - 14} y="34" font-size="13" fill="#6a645a" font-style="italic">y</text>
		<!-- components (thick, faded) -->
		<line x1={ox} y1={oy} x2={ox} y2={tipY} stroke="#b5631f" stroke-width="5" opacity="0.4" />
		<line x1={ox} y1={oy} x2={tipX} y2={oy} stroke="#b5631f" stroke-width="5" opacity="0.4" />
		<!-- projection dashes -->
		<line x1={tipX} y1={tipY} x2={ox} y2={tipY} stroke="#b5631f" stroke-width="1.3" stroke-dasharray="5 4" />
		<line x1={tipX} y1={tipY} x2={tipX} y2={oy} stroke="#b5631f" stroke-width="1.3" stroke-dasharray="5 4" />
		<!-- the vector -->
		<line x1={ox} y1={oy} x2={tipX} y2={tipY} stroke="#0e6b63" stroke-width="3.5" marker-end="url(#vm)" />
		<!-- angle arc -->
		<path d={arc} fill="none" stroke="#9a3b2e" stroke-width="2.5" />
		<text x={ox + 10} y={oy - 62} font-size="13" fill="#9a3b2e" font-weight="700">{theta}&deg;</text>
		<text x={tipX + 6} y={tipY - 4} font-size="13" fill="#0e6b63" font-weight="700">{label} = {magnitude}</text>
		<defs>
			<marker id="vx" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#201d18" /></marker>
			<marker id="vy" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#201d18" /></marker>
			<marker id="vm" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#0e6b63" /></marker>
		</defs>
	</svg>
</div>

<style>
	.demo {
		display: grid;
		grid-template-columns: 1fr 360px;
		gap: 20px;
		align-items: center;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 20px 22px;
		box-shadow: var(--shadow);
		margin: 24px 0;
	}
	@media (max-width: 720px) {
		.demo {
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
		margin-bottom: 14px;
	}
	.readout {
		font-family: 'JetBrains Mono', monospace;
		font-size: 14px;
		line-height: 1.9;
	}
	.readout b {
		color: var(--good);
	}
	.x {
		color: var(--accent2);
		font-weight: 600;
	}
	.y {
		color: var(--accent2);
		font-weight: 600;
	}
	.hint {
		font-family: 'Inter', sans-serif;
		font-size: 13.5px;
		color: var(--muted);
		margin: 14px 0 0;
		line-height: 1.5;
	}
	svg {
		width: 100%;
		height: auto;
		font-family: 'Inter', sans-serif;
	}
</style>
