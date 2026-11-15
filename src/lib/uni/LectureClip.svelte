<script lang="ts">
	// A deep link into the actual Panopto lecture recording, jumped to a timestamp.
	// Opens the ReVIEW viewer at ?id=<session>&start=<seconds> so you land on the
	// exact clip. Needs a logged-in Loughborough session (it is your own recording).
	let { id, start = 0, label = '' }: { id: string; start?: number; label?: string } = $props();

	const base = 'https://lboro.cloud.panopto.eu/Panopto/Pages/Viewer.aspx';
	const href = $derived(`${base}?id=${id}&start=${Math.floor(start)}`);
	const mmss = $derived.by(() => {
		const s = Math.floor(start);
		const m = Math.floor(s / 60);
		const r = s % 60;
		return `${m}:${r.toString().padStart(2, '0')}`;
	});
</script>

<a class="clip" {href} target="_blank" rel="noopener noreferrer">
	<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
	<span>watch the clip{label ? ` - ${label}` : ''} <b>{mmss}</b></span>
</a>

<style>
	.clip {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		font-family: 'Inter', sans-serif;
		font-size: 12.5px;
		font-weight: 500;
		color: var(--accent, #0e6b63);
		background: color-mix(in srgb, var(--accent, #0e6b63) 9%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent, #0e6b63) 28%, transparent);
		border-radius: 999px;
		padding: 4px 11px 4px 8px;
		text-decoration: none;
		transition:
			background 0.14s ease,
			transform 0.1s ease;
		margin: 2px 0;
	}
	.clip:hover {
		background: color-mix(in srgb, var(--accent, #0e6b63) 16%, transparent);
	}
	.clip:active {
		transform: translateY(1px);
	}
	.clip svg {
		width: 13px;
		height: 13px;
		flex: none;
	}
	.clip b {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}
</style>
