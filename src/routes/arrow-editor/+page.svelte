<script lang="ts">
	// Dev tool: the home page with an editable scroll-trail arrow (see $lib/ArrowEditor).
	import Home from '../+page.svelte';
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- The scroll trail belongs to the footer layout (the header one doesn't draw it). -->
<Home editArrow scene="footer" />
