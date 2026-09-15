<script lang="ts">
	// The StrandBeest walking along the bottom of the screen. The animation walks it in place
	// (static/images/beest-walk.webp, cut out of the build write-up's GIF, played backwards
	// so it steps left to right); the page carries it across. Purely decorative: it never
	// takes clicks, and it's left out entirely for people who ask for reduced motion.
	import { onMount } from 'svelte';

	// The clip's planted feet sweep backwards at this speed (clip pixels per second, measured
	// from its frames). Carrying the beest forward at exactly that speed, scaled to its size
	// on screen, keeps its feet planted instead of gliding, whatever the screen width.
	const FOOT_SPEED = 32.5; // each planted foot drifts 1.62 px/frame (60px over its 40 frames) at 20fps
	const CLIP_W = 224;
	const CLIP_H = 188;

	let img = $state<HTMLImageElement>();
	let duration = $state(45); // seconds to cross the screen; replaced once measured

	onMount(() => {
		const fit = () => {
			if (!img) return;
			const h = img.getBoundingClientRect().height || img.height;
			const speed = FOOT_SPEED * (h / CLIP_H); // screen px per second
			duration = (window.innerWidth + h * (CLIP_W / CLIP_H)) / speed;
		};
		fit();
		window.addEventListener('resize', fit);
		return () => window.removeEventListener('resize', fit);
	});
</script>

<div class="lane" aria-hidden="true">
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
	.lane {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 5;
		height: 0;
		pointer-events: none;
	}
	.beest {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 120px;
		width: auto;
		/* Start just off the left edge, finish just off the right, then go round again. The
		   duration is set from the screen width so the walking speed stays constant. */
		animation: walk-across 45s linear infinite;
	}
	@keyframes walk-across {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(100vw);
		}
	}
	@media (max-width: 700px) {
		.beest {
			height: 80px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.lane {
			display: none;
		}
	}
</style>
