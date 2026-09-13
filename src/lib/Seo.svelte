<script lang="ts">
	// Title, description, canonical, social cards and optional JSON-LD for a page.
	import { absolute, profile } from '$lib/content';
	import { markdownUrl } from '$lib/markdown';
	import { jsonLdTag } from '$lib/seo';

	type Props = {
		title: string;
		description: string;
		/** Site path of the page; omit for pages without a stable URL (errors). */
		path?: string;
		type?: 'website' | 'profile' | 'article';
		noindex?: boolean;
		jsonLd?: unknown;
	};
	let { title, description, path, type = 'website', noindex = false, jsonLd }: Props = $props();

	const url = $derived(path === undefined ? undefined : absolute(path));
	const image = absolute(profile.image.src);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="author" content={profile.name} />
	{#if noindex}
		<meta name="robots" content="noindex" />
	{/if}
	{#if path !== undefined && url}
		{#if !noindex}
			<link rel="canonical" href={url} />
		{/if}
		<link rel="alternate" type="text/markdown" href={markdownUrl(path)} />
		<meta property="og:url" content={url} />
	{/if}
	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={profile.name} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content={String(profile.image.width)} />
	<meta property="og:image:height" content={String(profile.image.height)} />
	<meta property="og:image:alt" content={profile.image.alt} />
	{#if type === 'profile'}
		<meta property="profile:first_name" content={profile.givenName} />
		<meta property="profile:last_name" content={profile.familyName} />
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	{#if jsonLd}
		{@html jsonLdTag(jsonLd)}
	{/if}
</svelte:head>
