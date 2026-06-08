<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, viewport-fit=cover"
	/>
	<meta name="theme-color" content="#0d9488" />
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

{@render children()}
