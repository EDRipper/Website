<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();

	// When the tab is hidden (switched away from or minimised) its title calls the visitor
	// back; the real title returns as soon as they do.
	const AWAY_TITLE = 'hey come back!';
	onMount(() => {
		let saved: string | null = null;
		const onVisibility = () => {
			if (document.hidden) {
				if (saved !== null) return;
				saved = document.title;
				document.title = AWAY_TITLE;
			} else if (saved !== null) {
				document.title = saved;
				saved = null;
			}
		};
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			document.removeEventListener('visibilitychange', onVisibility);
			if (saved !== null) document.title = saved;
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
