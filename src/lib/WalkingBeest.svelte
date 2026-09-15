<script lang="ts">
	// The StrandBeest walking along the bottom of whatever it's placed in (the StrandBeest
	// mission card). The animation walks it in place (static/images/beest-walk.webp, cut out
	// of the build write-up's GIF, played backwards so it steps left to right); the page
	// carries it across. Its container should be a flex column that clips (the mission card is).
	// Purely decorative: it never takes clicks, and it's left out entirely for people who ask
	// for reduced motion.
	import { onMount } from 'svelte';

	// The clip's planted feet sweep backwards at this speed (clip pixels per second, measured
	// from its frames). Carrying the beest forward at exactly that speed, scaled to its size
	// on screen, keeps its feet planted instead of gliding, whatever the container's width.
	const FOOT_SPEED = 32.5; // each planted foot drifts 1.62 px/frame (60px over its 40 frames) at 20fps
	const CLIP_W = 224;
	const CLIP_H = 188;

	let lane = $state<HTMLDivElement>();
	let img = $state<HTMLImageElement>();
	let duration = $state(12); // seconds to cross the container; replaced once measured

	onMount(() => {
		const fit = () => {
			if (!img || !lane) return;
			const h = img.getBoundingClientRect().height || img.height;
			const speed = FOOT_SPEED * (h / CLIP_H); // screen px per second
			duration = (lane.getBoundingClientRect().width + h * (CLIP_W / CLIP_H)) / speed;
		};
		fit();
		const ro = new ResizeObserver(fit);
		if (lane) ro.observe(lane);
		return () => ro.disconnect();
	});
</script>

<div class="lane" aria-hidden="true" bind:this={lane}>
	<img
		class="beest"
		src="/images/beest-walk.webp"
		alt=""
		width={CLIP_W}
		height={CLIP_H}
		decoding="async"
		bind:this={img}
		style:animation-duration="{duration}s"
	/>
</div>

<style>
	/* Its own strip at the foot of the card, with a line to walk along. It sits in the flow (the
	   card is a flex column), so the card's text can never run into it. */
	.lane {
		position: relative;
		margin-top: auto;
		height: 104px;
		border-bottom: var(--bw, 2px) solid var(--border);
		pointer-events: none;
		transition: opacity 0.35s ease;
	}
	/* While the card is showing its photo, the walk gets out of the way (its space is kept, so
	   nothing in the card shifts). */
	:global(.mission.hovering) .lane {
		opacity: 0;
	}
	.beest {
		position: absolute;
		bottom: 0;
		height: 96px;
		width: auto;
		/* Start just off the container's left edge, finish just off its right, then go round
		   again. The duration is set from the container's width so the walking speed stays
		   constant. */
		animation: walk-across 12s linear infinite;
	}
	@keyframes walk-across {
		from {
			left: 0;
			transform: translateX(-100%);
		}
		to {
			left: 100%;
			transform: translateX(0);
		}
	}
	@media (max-width: 700px) {
		.lane {
			height: 80px;
		}
		.beest {
			height: 72px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.lane {
			display: none;
		}
	}
</style>
