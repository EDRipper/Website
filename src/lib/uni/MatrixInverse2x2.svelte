<script lang="ts">
	// Interactive 2x2 inverse. Type the four entries and watch the determinant
	// ad - bc decide whether an inverse exists, then the inverse build itself.
	// When ad - bc = 0 the matrix is singular and the formula "crashes" - exactly
	// the point the lecturer made.
	let a = $state(2);
	let b = $state(1);
	let c = $state(-5);
	let d = $state(3);

	const det = $derived(a * d - b * c);
	const singular = $derived(det === 0);
	const fmt = (x: number) => {
		const v = Math.round(x * 1000) / 1000;
		return Object.is(v, -0) ? '0' : String(v);
	};
</script>

<div class="mx">
	<div class="controls">
		<p class="lab">matrix A</p>
		<div class="grid2">
			<input type="number" bind:value={a} aria-label="a" />
			<input type="number" bind:value={b} aria-label="b" />
			<input type="number" bind:value={c} aria-label="c" />
			<input type="number" bind:value={d} aria-label="d" />
		</div>
		<p class="hint">
			change any entry. the inverse exists only while the determinant is non-zero - slide the four
			numbers until ad - bc hits 0 and watch it collapse.
		</p>
	</div>

	<div class="out">
		<div class="line">
			det A = ad &minus; bc = ({fmt(a)})({fmt(d)}) &minus; ({fmt(b)})({fmt(c)}) =
			<b class:zero={singular}>{fmt(det)}</b>
		</div>
		{#if singular}
			<div class="sing">singular - no inverse (the formula divides by zero)</div>
		{:else}
			<div class="inv-wrap">
				<span class="coef">1 / {fmt(det)}</span>
				<div class="grid2 inv">
					<span>{fmt(d)}</span><span>{fmt(-b)}</span>
					<span>{fmt(-c)}</span><span>{fmt(a)}</span>
				</div>
				<span class="eq">=</span>
				<div class="grid2 inv final">
					<span>{fmt(d / det)}</span><span>{fmt(-b / det)}</span>
					<span>{fmt(-c / det)}</span><span>{fmt(a / det)}</span>
				</div>
			</div>
			<p class="note">swap a and d, negate b and c, divide by the determinant. that is the whole 2x2 rule.</p>
		{/if}
	</div>
</div>

<style>
	.mx {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 22px;
		align-items: center;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 20px 22px;
		box-shadow: var(--shadow);
		margin: 24px 0;
	}
	@media (max-width: 720px) {
		.mx {
			grid-template-columns: 1fr;
		}
	}
	.lab {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: var(--muted);
		margin: 0 0 8px;
	}
	.grid2 {
		display: grid;
		grid-template-columns: repeat(2, 56px);
		gap: 8px;
		justify-content: start;
	}
	input[type='number'] {
		width: 56px;
		padding: 7px 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 15px;
		text-align: center;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: #fbfaf5;
		color: var(--ink);
	}
	.hint,
	.note {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: var(--muted);
		line-height: 1.5;
		margin: 12px 0 0;
	}
	.out {
		font-family: 'JetBrains Mono', monospace;
		font-size: 14px;
	}
	.line b {
		color: var(--good);
	}
	.line b.zero {
		color: var(--flag);
	}
	.sing {
		margin-top: 12px;
		color: var(--flag);
		font-family: 'Inter', sans-serif;
		font-weight: 600;
		font-size: 14px;
	}
	.inv-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 14px;
		flex-wrap: wrap;
	}
	.coef {
		color: var(--muted);
	}
	.grid2.inv {
		grid-template-columns: repeat(2, 42px);
		gap: 4px;
		border-left: 2px solid var(--ink);
		border-right: 2px solid var(--ink);
		padding: 4px 6px;
	}
	.grid2.inv span {
		text-align: center;
	}
	.grid2.inv.final span {
		color: var(--accent);
		font-weight: 600;
	}
	.eq {
		color: var(--muted);
	}
</style>
