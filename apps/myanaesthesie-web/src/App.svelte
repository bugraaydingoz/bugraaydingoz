<script lang="ts">
    import ConcentrationCard from "$lib/components/app/concentration-card.svelte";
    import PatientCard from "$lib/components/app/patient-card.svelte";
    import PerfusorCard from "$lib/components/app/perfusor-card.svelte";
    import PhysiologyCard from "$lib/components/app/physiology-card.svelte";
    import ProductTabs from "$lib/components/app/product-tabs.svelte";
    import {
        getProductDescription,
        getProductTitle,
        products,
        type Product,
    } from "$lib/products";

    let activeProduct = $state<Product>("perfusor");
</script>

<svelte:head>
    <title>{getProductTitle(activeProduct)} | MyAnästhesie</title>
    <meta
        name="description"
        content="Mobile Anaesthesie-Rechner mit Offline-Unterstuetzung."
    />
</svelte:head>

<main
    class="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(174_68%_92%),transparent_34rem),linear-gradient(180deg,hsl(180_35%_98%),hsl(176_38%_95%))] px-4 pt-5 pb-28 text-foreground sm:px-6 lg:px-8"
>
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header class="space-y-1">
            <p
                class="text-sm font-semibold tracking-[0.18em] text-primary uppercase"
            >
                MyAnästhesie
            </p>
            <h1
                class="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl"
            >
                {getProductTitle(activeProduct)}
            </h1>
            <p
                class="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base"
            >
                {getProductDescription(activeProduct)}
            </p>
        </header>

        <section
            class="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start"
        >
            <PatientCard />

            {#if activeProduct === "perfusor"}
                <PerfusorCard />
            {:else if activeProduct === "physiology"}
                <PhysiologyCard />
            {:else}
                <ConcentrationCard />
            {/if}
        </section>
    </div>
</main>

<ProductTabs bind:value={activeProduct} {products} />
