<script lang="ts">
	// Type a year and watch the three boolean conditions light up, then combine.
	// Leap year rule from the lecture: (year % 4 == 0) and (year % 100 != 0 or year % 400 == 0)
	let year = $state(2024);

	let by4 = $derived(year % 4 === 0);
	let by100 = $derived(year % 100 === 0);
	let by400 = $derived(year % 400 === 0);
	// the inner clause: not divisible by 100, OR divisible by 400
	let notCentury = $derived(!by100 || by400);
	let leap = $derived(by4 && notCentury);
</script>

<div class="ly">
	<label class="pick">
		year
		<input type="number" min="1" max="4000" bind:value={year} />
	</label>

	<div class="conds">
		<div class="cond" class:yes={by4}>
			<code>year % 4 == 0</code><span class="v">{by4}</span>
			<span class="why">divisible by 4?</span>
		</div>
		<div class="cond" class:yes={notCentury}>
			<code>year % 100 != 0 or year % 400 == 0</code><span class="v">{notCentury}</span>
			<span class="why">not a century, unless a 400-year one</span>
		</div>
	</div>

	<div class="verdict" class:leap>
		<code>is_leap({year})</code>
		<span class="res">{leap ? 'LEAP YEAR' : 'common year'}</span>
	</div>
	<p class="note">
		both conditions must be true (the <b>and</b>). 2000 is a leap year (divisible by 400) but 1900
		is not (century, not divisible by 400) - try them.
	</p>
</div>

<style>
	.ly {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 20px 22px;
		box-shadow: var(--shadow);
		margin: 24px 0;
		font-family: 'Inter', sans-serif;
	}
	.pick {
		font-size: 14px;
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 16px;
	}
	.pick input {
		font-family: 'JetBrains Mono', monospace;
		font-size: 18px;
		width: 110px;
		padding: 5px 9px;
		border: 1.5px solid var(--line);
		border-radius: 8px;
		background: #fbfaf5;
		color: var(--ink);
	}
	.conds {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.cond {
		display: grid;
		grid-template-columns: 1fr auto;
		row-gap: 2px;
		align-items: center;
		border: 1px solid var(--line);
		border-left: 3px solid var(--line);
		border-radius: 10px;
		padding: 10px 14px;
		background: #fbfaf5;
		transition: all 0.12s ease;
	}
	.cond.yes {
		border-left-color: var(--good);
		background: #eef5f1;
	}
	.cond code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13.5px;
		background: none;
	}
	.cond .v {
		font-family: 'JetBrains Mono', monospace;
		font-weight: 600;
		color: var(--muted);
	}
	.cond.yes .v {
		color: var(--good);
	}
	.cond .why {
		grid-column: 1 / -1;
		font-size: 12px;
		color: var(--muted);
	}
	.verdict {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 14px;
		padding: 12px 16px;
		border-radius: 11px;
		background: #efe9dd;
		border: 1px solid var(--line);
	}
	.verdict code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 14px;
		background: none;
	}
	.verdict .res {
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--muted);
	}
	.verdict.leap {
		background: #eef5f1;
		border-color: var(--good);
	}
	.verdict.leap .res {
		color: var(--good);
	}
	.note {
		font-size: 13px;
		color: var(--muted);
		margin: 14px 0 0;
		line-height: 1.5;
	}
</style>
