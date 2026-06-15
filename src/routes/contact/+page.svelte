<script lang="ts">
	// Contact / "pitch a mission" page.
</script>

<svelte:head>
	<title>Euan Ripper — Contact</title>
</svelte:head>

<main class="screen">
	<a class="back" href="/">‹ BACK</a>

	<section class="panel">
		<h1>NEW MISSION</h1>
		<p>Want to work on something together? Send me your pitch.</p>

		<div class="links">
			<a href="mailto:euan@hackclub.com">EMAIL</a>
			<a href="https://github.com/edRipper" target="_blank" rel="noopener noreferrer">GITHUB</a>
			<a href="https://www.linkedin.com/in/euan-ripper-ab876528b/" target="_blank" rel="noopener noreferrer">LINKEDIN</a>
		</div>
	</section>
</main>

<style>
	.screen {
		min-height: 100vh;
		box-sizing: border-box;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		font-family: 'Departure Mono', ui-monospace, monospace;
	}
	.back {
		text-decoration: none;
		color: inherit;
		font-size: 0.8rem;
	}
	.panel {
		border: 1px solid #ccc;
		padding: 1.5rem;
		max-width: 480px;
	}
	.panel h1 {
		margin: 0 0 0.75rem;
		font-size: 1.4rem;
	}
	.panel p {
		margin: 0 0 1.5rem;
		font-size: 0.9rem;
		line-height: 1.5;
	}
	.links {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.links a {
		border: 1px solid #ccc;
		padding: 0.5rem;
		text-align: center;
		text-decoration: none;
		color: inherit;
		font-size: 0.75rem;
	}
</style>
