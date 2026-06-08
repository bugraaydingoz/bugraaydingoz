<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import UnitInput from "$lib/components/app/unit-input.svelte";
    import { Label } from "$lib/components/ui/label/index.js";
    import { patient } from "$lib/patient-state.svelte";
    import {
        calculateMlPerHour,
        getDefaultDoseInputs,
        medications,
        parseDecimalInput,
        type DoseUnit,
        type MedicationColor,
    } from "$lib/perfusor";
    import { cn } from "$lib/utils";

    const colorClasses: Record<
        MedicationColor,
        { text: string; row: string }
    > = {
        purple: {
            text: "text-purple-700",
            row: "border-l-purple-500",
        },
        blue: {
            text: "text-blue-700",
            row: "border-l-blue-500",
        },
        yellow: {
            text: "text-yellow-700",
            row: "border-l-yellow-400",
        },
        red: {
            text: "text-red-700",
            row: "border-l-red-500",
        },
        black: {
            text: "text-neutral-950",
            row: "border-l-neutral-950",
        },
    };

    let doseInputs = $state<Record<string, string>>(
        getDefaultDoseInputs(patient.group),
    );

    $effect(() => {
        doseInputs = getDefaultDoseInputs(patient.group);
    });

    const numberFormatter = new Intl.NumberFormat("de-DE", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    });

    function formatMlPerHour(value: number | null) {
        return value === null ? "-" : numberFormatter.format(value);
    }

    function formatDoseUnit(unit: DoseUnit) {
        return unit.replace("microg", "µg");
    }
</script>

<Card.Root class="overflow-hidden shadow-sm">
    <Card.Header>
        <Card.Title>Medikamente</Card.Title>
        <Card.Description>Laufbahn anpassen und ml/h ablesen</Card.Description>
    </Card.Header>
    <Card.Content class="p-0">
        <div role="table" aria-label="Medikamente">
            <div
                role="row"
                class="grid grid-cols-[minmax(0,11.5rem)_minmax(4rem,1fr)] gap-x-3 gap-y-1 bg-muted/70 px-4 py-3 sm:grid-cols-[minmax(10rem,1fr)_minmax(11rem,13rem)_minmax(5rem,8rem)] sm:gap-0 sm:p-0"
            >
                <div
                    role="columnheader"
                    class="col-span-2 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:col-span-1 sm:px-4 sm:py-3"
                >
                    Medikament
                </div>
                <div
                    role="columnheader"
                    class="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:px-4 sm:py-3"
                >
                    Laufbahn
                </div>
                <div
                    role="columnheader"
                    class="text-right text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:px-4 sm:py-3"
                >
                    ml/h
                </div>
            </div>

            <div role="rowgroup">
                {#each medications as medication}
                    {@const parsedDose = parseDecimalInput(
                        doseInputs[medication.id] ?? "",
                    )}
                    {@const parsedWeight = parseDecimalInput(
                        patient.weightInput,
                    )}
                    {@const mlPerHour = calculateMlPerHour({
                        dose: parsedDose,
                        weightKg: parsedWeight,
                        medication,
                    })}
                    {@const doseUnit = formatDoseUnit(medication.unit)}
                    <div
                        role="row"
                        class={cn(
                            "grid grid-cols-[minmax(0,11.5rem)_minmax(4rem,1fr)] gap-x-3 gap-y-3 border-t border-l-4 border-t-border bg-card p-4 first:border-t-0 sm:grid-cols-[minmax(10rem,1fr)_minmax(11rem,13rem)_minmax(5rem,8rem)] sm:items-center sm:gap-0 sm:p-0",
                            colorClasses[medication.color].row,
                        )}
                    >
                        <div
                            role="cell"
                            class="col-span-2 sm:col-span-1 sm:px-4 sm:py-4"
                        >
                            <span
                                class={cn(
                                    "font-semibold",
                                    colorClasses[medication.color].text,
                                )}
                            >
                                {medication.name}
                            </span>
                        </div>

                        <div role="cell" class="min-w-0 sm:px-4 sm:py-4">
                            <Label class="grid max-w-44 gap-1">
                                <span class="sr-only">
                                    {medication.name} Laufbahn
                                </span>
                                <UnitInput
                                    class="h-11 text-base font-semibold md:text-base"
                                    value={doseInputs[medication.id] ?? ""}
                                    unit={doseUnit}
                                    unitClass="text-[11px]"
                                    aria-label={`${medication.name} Laufbahn`}
                                    oninput={(
                                        event: Event & {
                                            currentTarget: HTMLInputElement;
                                        },
                                    ) => {
                                        doseInputs[medication.id] =
                                            event.currentTarget.value;
                                    }}
                                />
                            </Label>
                        </div>

                        <div
                            role="cell"
                            class="text-right sm:px-4 sm:py-4"
                        >
                            <div class="text-2xl font-semibold tabular-nums">
                                {formatMlPerHour(mlPerHour)}
                            </div>
                            {#if !medication.concentration}
                                <div
                                    class="text-xs font-medium text-muted-foreground"
                                >
                                    Konzentration fehlt
                                </div>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </Card.Content>
</Card.Root>
