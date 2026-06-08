<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import type { Product } from "$lib/products";

    let {
        value = $bindable(),
        products,
    }: {
        value: Product;
        products: Array<{ value: Product; label: string }>;
    } = $props();
</script>

<nav
    class="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
>
    <div
        class="mx-auto grid max-w-xl grid-cols-3 gap-1 rounded-4xl border border-border/80 bg-background/90 p-1 shadow-lg backdrop-blur"
        aria-label="Produkte"
    >
        {#each products as product}
            <Button
                variant={value === product.value ? "default" : "ghost"}
                class="h-14 rounded-[1.6rem] text-sm font-semibold"
                aria-current={value === product.value ? "page" : undefined}
                onclick={() => {
                    value = product.value;
                }}
            >
                <span class="inline">{product.label}</span>
            </Button>
        {/each}
    </div>
</nav>
