<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import UnitInput from "$lib/components/app/unit-input.svelte";
    import { Label } from "$lib/components/ui/label/index.js";
    import {
        calculateDilutedConcentration,
        calculateRequiredDiluentVolume,
        percentageToMilligramPerMl,
    } from "$lib/concentration";
    import { parseDecimalInput } from "$lib/perfusor";

    type ConcentrationInputMode =
        | "diluent"
        | "targetPercentage"
        | "targetMgPerMl";

    let sourcePercentageInput = $state("0,5");
    let drugVolumeInput = $state("10");
    let diluentVolumeInput = $state("10");
    let targetPercentageInput = $state("0,25");
    let targetMgPerMlInput = $state("2,5");
    let concentrationInputMode = $state<ConcentrationInputMode>("diluent");

    const threeDecimalFormatter = new Intl.NumberFormat("de-DE", {
        maximumFractionDigits: 3,
        minimumFractionDigits: 0,
    });

    function formatConcentrationValue(value: number | null) {
        return value === null ? "-" : threeDecimalFormatter.format(value);
    }

    function formatEditableNumber(value: number | null) {
        return value === null ? "" : threeDecimalFormatter.format(value);
    }

    function handleDiluentInput(value: string) {
        diluentVolumeInput = value;
        concentrationInputMode = "diluent";
        const dilutedConcentration = calculateDilutedConcentration({
            sourcePercentage: parseDecimalInput(sourcePercentageInput),
            drugVolumeMl: parseDecimalInput(drugVolumeInput),
            diluentVolumeMl: parseDecimalInput(value),
        });

        targetPercentageInput = formatEditableNumber(
            dilutedConcentration?.percentage ?? null,
        );
        targetMgPerMlInput = formatEditableNumber(
            dilutedConcentration?.milligramPerMl ?? null,
        );
    }

    function handleTargetPercentageInput(value: string) {
        targetPercentageInput = value;
        concentrationInputMode = "targetPercentage";
        targetMgPerMlInput = formatEditableNumber(
            percentageToMilligramPerMl(parseDecimalInput(value)),
        );
        const requiredDiluent = calculateRequiredDiluentVolume({
            sourcePercentage: parseDecimalInput(sourcePercentageInput),
            drugVolumeMl: parseDecimalInput(drugVolumeInput),
            targetPercentage: parseDecimalInput(value),
        });

        diluentVolumeInput = formatEditableNumber(requiredDiluent);
    }

    function handleTargetMgPerMlInput(value: string) {
        targetMgPerMlInput = value;
        concentrationInputMode = "targetMgPerMl";
        const targetMgPerMl = parseDecimalInput(value);
        const targetPercentage =
            targetMgPerMl === null ? null : targetMgPerMl / 10;

        targetPercentageInput = formatEditableNumber(targetPercentage);

        const requiredDiluent = calculateRequiredDiluentVolume({
            sourcePercentage: parseDecimalInput(sourcePercentageInput),
            drugVolumeMl: parseDecimalInput(drugVolumeInput),
            targetPercentage,
        });

        diluentVolumeInput = formatEditableNumber(requiredDiluent);
    }

    function syncConcentrationInputs() {
        if (concentrationInputMode === "targetMgPerMl") {
            handleTargetMgPerMlInput(targetMgPerMlInput);
            return;
        }

        if (concentrationInputMode === "targetPercentage") {
            handleTargetPercentageInput(targetPercentageInput);
            return;
        }

        handleDiluentInput(diluentVolumeInput);
    }
</script>

<Card.Root class="shadow-sm">
    <Card.Header>
        <Card.Title>Konzentration</Card.Title>
        <Card.Description>Ausgangslösung mit NaCl verdünnen</Card.Description>
    </Card.Header>
    <Card.Content>
        {@const sourcePercentage = parseDecimalInput(sourcePercentageInput)}
        {@const drugVolumeMl = parseDecimalInput(drugVolumeInput)}
        {@const diluentVolumeMl = parseDecimalInput(diluentVolumeInput)}
        {@const sourceMgPerMl = percentageToMilligramPerMl(sourcePercentage)}
        <div
            class="grid gap-4 md:grid-cols-[minmax(12rem,1fr)_auto_minmax(10rem,0.75fr)_auto_minmax(12rem,1fr)] md:items-start"
        >
            <div class="grid gap-2">
                <p class="text-sm font-medium text-card-foreground">
                    Konzentration
                </p>
                <div class="grid gap-2">
                    <UnitInput
                        class="h-11 text-base font-medium md:text-base"
                        value={sourcePercentageInput}
                        unit="%"
                        aria-label="Ausgangskonzentration in Prozent"
                        oninput={(
                            event: Event & {
                                currentTarget: HTMLInputElement;
                            },
                        ) => {
                            sourcePercentageInput = event.currentTarget.value;
                            syncConcentrationInputs();
                        }}
                    />
                    <UnitInput
                        class="h-11 text-base font-medium md:text-base"
                        value={drugVolumeInput}
                        unit="ml"
                        aria-label="Medikament Menge in Milliliter"
                        oninput={(
                            event: Event & {
                                currentTarget: HTMLInputElement;
                            },
                        ) => {
                            drugVolumeInput = event.currentTarget.value;
                            syncConcentrationInputs();
                        }}
                    />
                </div>
                <p class="text-xs font-medium text-muted-foreground">
                    {formatConcentrationValue(sourceMgPerMl)} mg/ml
                </p>
            </div>

            <div
                class="hidden pt-9 text-2xl font-semibold text-muted-foreground md:block"
            >
                +
            </div>

            <Label class="grid gap-2 text-sm font-medium text-card-foreground">
                NaCl
                <UnitInput
                    class="h-11 text-base font-medium md:text-base"
                    value={diluentVolumeInput}
                    unit="ml"
                    aria-label="NaCl Menge in Milliliter"
                    oninput={(
                        event: Event & {
                            currentTarget: HTMLInputElement;
                        },
                    ) => {
                        handleDiluentInput(event.currentTarget.value);
                    }}
                />
            </Label>

            <div
                class="hidden pt-9 text-2xl font-semibold text-muted-foreground md:block"
            >
                =
            </div>

            <div class="grid gap-2">
                <p class="text-sm font-medium text-card-foreground">Ziel</p>
                <div class="grid gap-2">
                    <UnitInput
                        class="h-11 text-base font-medium md:text-base"
                        value={targetPercentageInput}
                        unit="%"
                        aria-label="Zielkonzentration in Prozent"
                        oninput={(
                            event: Event & {
                                currentTarget: HTMLInputElement;
                            },
                        ) => {
                            handleTargetPercentageInput(
                                event.currentTarget.value,
                            );
                        }}
                    />
                    <UnitInput
                        class="h-11 text-base font-medium md:text-base"
                        value={targetMgPerMlInput}
                        unit="mg/ml"
                        aria-label="Zielkonzentration in Milligramm pro Milliliter"
                        oninput={(
                            event: Event & {
                                currentTarget: HTMLInputElement;
                            },
                        ) => {
                            handleTargetMgPerMlInput(event.currentTarget.value);
                        }}
                    />
                </div>
                <p class="text-xs font-medium text-muted-foreground">
                    {formatConcentrationValue(sourcePercentage)}% + {formatConcentrationValue(
                        diluentVolumeMl,
                    )}
                    ml NaCl
                </p>
            </div>
        </div>
    </Card.Content>
</Card.Root>
