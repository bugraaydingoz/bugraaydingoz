<script lang="ts">
    import { Input } from "$lib/components/ui/input/index.js";
    import { cn } from "$lib/utils";
    import type {
        HTMLInputAttributes,
        HTMLInputTypeAttribute,
    } from "svelte/elements";

    type UnitPadding = "sm" | "md" | "lg";
    type InputType = Exclude<HTMLInputTypeAttribute, "file">;

    type Props = Omit<HTMLInputAttributes, "class" | "files" | "type"> & {
        class?: string;
        type?: InputType;
        unit: string;
        unitClass?: string;
        unitPadding?: UnitPadding;
    };

    let {
        value = $bindable(),
        unit,
        unitClass,
        unitPadding,
        class: className,
        type = "text",
        autocomplete = "off",
        inputmode = "decimal",
        ...restProps
    }: Props = $props();

    const paddingClasses = {
        sm: "pr-9",
        md: "pr-16",
        lg: "pr-24",
    } satisfies Record<UnitPadding, string>;

    const computedUnitPadding = $derived(
        unitPadding ?? (unit.length > 7 ? "lg" : unit.length > 2 ? "md" : "sm"),
    );
</script>

<div class="relative">
    <Input
        class={cn(
            "h-12 rounded-lg bg-background px-3 text-xl font-semibold md:text-xl",
            paddingClasses[computedUnitPadding],
            className,
        )}
        {type}
        {autocomplete}
        {inputmode}
        bind:value
        {...restProps}
    />
    <span
        class={cn(
            "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold whitespace-nowrap text-muted-foreground",
            unitClass,
        )}
    >
        {unit}
    </span>
</div>
