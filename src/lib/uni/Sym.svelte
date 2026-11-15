<script lang="ts">
	// A symbol with a hover / tap / focus glossary popover. Wrap any symbol in the
	// notes and pass what it means: <Sym def="tight-side belt tension (N)">T&#8322;</Sym>.
	// Hover on desktop, tap on touch, Tab + Enter for keyboard - all show the same note.
	let { children, def }: { children: import('svelte').Snippet; def: string } = $props();
	let open = $state(false);
</script>

<span
	class="sym"
	class:open
	role="button"
	tabindex="0"
	aria-label={def}
	onclick={() => (open = !open)}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			open = !open;
		} else if (e.key === 'Escape') {
			open = false;
		}
	}}
	onmouseenter={() => (open = true)}
	onmouseleave={() => (open = false)}
	onblur={() => (open = false)}
>{@render children()}<span class="pop" role="tooltip">{def}</span></span>

<style>
	.sym {
		position: relative;
		cursor: help;
		border-bottom: 1.5px dotted var(--accent, #0e6b63);
		outline: none;
		white-space: nowrap;
	}
	.sym:focus-visible {
		border-radius: 3px;
		box-shadow: 0 0 0 2px var(--accent, #0e6b63);
	}
	.pop {
		position: absolute;
		left: 50%;
		bottom: calc(100% + 9px);
		transform: translateX(-50%) translateY(4px);
		min-width: 120px;
		max-width: 230px;
		width: max-content;
		background: #201d18;
		color: #f7f4ee;
		font-family: 'Inter', system-ui, sans-serif;
		font-size: 12.5px;
		font-style: normal;
		font-weight: 400;
		line-height: 1.4;
		letter-spacing: 0;
		text-align: center;
		white-space: normal;
		padding: 7px 10px;
		border-radius: 8px;
		box-shadow: 0 6px 20px rgba(32, 29, 24, 0.28);
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 0.12s ease,
			transform 0.12s ease;
		z-index: 40;
	}
	.pop::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 5px solid transparent;
		border-top-color: #201d18;
	}
	.sym.open .pop {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}
</style>
