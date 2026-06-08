<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import * as Table from "$lib/components/ui/table/index.js";
    import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
    import {
        calculateDilutedConcentration,
        calculateRequiredDiluentVolume,
        percentageToMilligramPerMl,
    } from "$lib/concentration";
    import { patient, type PatientSex } from "$lib/patient-state.svelte";
    import {
        calculateMlPerHour,
        getDefaultDoseInputs,
        medications,
        parseDecimalInput,
        type DoseUnit,
        type MedicationColor,
        type PatientGroup,
    } from "$lib/perfusor";
    import {
        bloodVolumeMlPerKg,
        calculateBloodVolumeLiters,
        calculateIdealBodyWeight,
        calculateTidalVolumeRangeMl,
    } from "$lib/physiology";
    import { cn } from "$lib/utils";

    type Product = "perfusor" | "physiology" | "concentration";
    type ConcentrationInputMode =
        | "diluent"
        | "targetPercentage"
        | "targetMgPerMl";

    const patientGroups = [
        { value: "adult", label: "Erwachsener" },
        { value: "child", label: "Kind" },
    ] satisfies Array<{ value: PatientGroup; label: string }>;

    const patientSexes = [
        { value: "female", label: "Weiblich" },
        { value: "male", label: "Männlich" },
    ] satisfies Array<{ value: PatientSex; label: string }>;

    const products = [
        { value: "perfusor", label: "Perfusoren" },
        { value: "physiology", label: "Parameter" },
        { value: "concentration", label: "Konzentration" },
    ] satisfies Array<{ value: Product; label: string }>;

    const colorClasses: Record<
        MedicationColor,
        { dot: string; text: string; row: string }
    > = {
        purple: {
            dot: "bg-purple-500",
            text: "text-purple-700",
            row: "border-l-purple-500",
        },
        blue: {
            dot: "bg-blue-500",
            text: "text-blue-700",
            row: "border-l-blue-500",
        },
        yellow: {
            dot: "bg-yellow-400",
            text: "text-yellow-700",
            row: "border-l-yellow-400",
        },
        red: {
            dot: "bg-red-500",
            text: "text-red-700",
            row: "border-l-red-500",
        },
        black: {
            dot: "bg-neutral-950",
            text: "text-neutral-950",
            row: "border-l-neutral-950",
        },
    };

    let activeProduct = $state<Product>("perfusor");
    let doseInputs = $state<Record<string, string>>(
        getDefaultDoseInputs(patient.group),
    );
    let sourcePercentageInput = $state("0,5");
    let drugVolumeInput = $state("10");
    let diluentVolumeInput = $state("10");
    let targetPercentageInput = $state("0,25");
    let targetMgPerMlInput = $state("2,5");
    let concentrationInputMode = $state<ConcentrationInputMode>("diluent");

    $effect(() => {
        doseInputs = getDefaultDoseInputs(patient.group);
    });

    const numberFormatter = new Intl.NumberFormat("de-DE", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    });

    const oneDecimalFormatter = new Intl.NumberFormat("de-DE", {
        maximumFractionDigits: 1,
        minimumFractionDigits: 0,
    });

    const threeDecimalFormatter = new Intl.NumberFormat("de-DE", {
        maximumFractionDigits: 3,
        minimumFractionDigits: 0,
    });

    const integerFormatter = new Intl.NumberFormat("de-DE", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    });

    function formatMlPerHour(value: number | null) {
        return value === null ? "-" : numberFormatter.format(value);
    }

    function formatDoseUnit(unit: DoseUnit) {
        return unit.replace("microg", "µg");
    }

    function formatKg(value: number | null) {
        return value === null ? "-" : `${oneDecimalFormatter.format(value)} kg`;
    }

    function formatLiters(value: number | null) {
        return value === null ? "-" : `${oneDecimalFormatter.format(value)} L`;
    }

    function formatMlRange(value: { lower: number; upper: number } | null) {
        if (value === null) {
            return "-";
        }

        return `${integerFormatter.format(value.lower)}-${integerFormatter.format(value.upper)} mL`;
    }

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

    function getProductTitle(product: Product) {
        if (product === "perfusor") {
            return "Perfusoren Rechner";
        }

        if (product === "physiology") {
            return "Physiologische Parameter";
        }

        return "Konzentrationsrechner";
    }

    function getProductDescription(product: Product) {
        if (product === "perfusor") {
            return "Schnelle Laufbahn-Berechnung für Perfusorspritzpumpen. Werte prüfen und lokal anpassen.";
        }

        if (product === "physiology") {
            return "Körpergewicht, Blutvolumen und Atemzugsvolumen aus gemeinsamen Patientendaten.";
        }

        return "Verdünnung mit NaCl vorwärts und rückwärts berechnen.";
    }
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
            <Card.Root class="shadow-sm">
                <Card.Header>
                    <Card.Title>Patient</Card.Title>
                    <Card.Description
                        >Gemeinsame Patientendaten</Card.Description
                    >
                </Card.Header>
                <Card.Content class="grid gap-4">
                    <div class="grid gap-2">
                        <p class="text-sm font-medium text-card-foreground">
                            Patientengruppe
                        </p>
                        <ToggleGroup.Root
                            type="single"
                            bind:value={patient.group}
                            variant="outline"
                            spacing={1}
                            class="grid w-full grid-cols-2"
                        >
                            {#each patientGroups as group}
                                <ToggleGroup.Item
                                    value={group.value}
                                    class="w-full"
                                >
                                    {group.label}
                                </ToggleGroup.Item>
                            {/each}
                        </ToggleGroup.Root>
                    </div>

                    <Label
                        class="grid gap-2 text-sm font-medium text-card-foreground"
                    >
                        Gewicht
                        <div class="relative">
                            <Input
                                class="h-14 rounded-lg bg-background px-4 pr-12 text-2xl font-semibold md:text-2xl"
                                inputmode="decimal"
                                type="text"
                                autocomplete="off"
                                bind:value={patient.weightInput}
                                aria-label="Gewicht in Kilogramm"
                            />
                            <span
                                class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold text-muted-foreground"
                            >
                                kg
                            </span>
                        </div>
                    </Label>

                    <Label
                        class="grid gap-2 text-sm font-medium text-card-foreground"
                    >
                        Größe
                        <div class="relative">
                            <Input
                                class="h-14 rounded-lg bg-background px-4 pr-12 text-2xl font-semibold md:text-2xl"
                                inputmode="decimal"
                                type="text"
                                autocomplete="off"
                                bind:value={patient.heightInput}
                                aria-label="Größe in Zentimeter"
                            />
                            <span
                                class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold text-muted-foreground"
                            >
                                cm
                            </span>
                        </div>
                    </Label>

                    <div class="grid gap-2">
                        <p class="text-sm font-medium text-card-foreground">
                            Geschlecht
                        </p>
                        <ToggleGroup.Root
                            type="single"
                            bind:value={patient.sex}
                            variant="outline"
                            spacing={1}
                            class="grid w-full grid-cols-2"
                        >
                            {#each patientSexes as sex}
                                <ToggleGroup.Item
                                    value={sex.value}
                                    class="w-full"
                                >
                                    {sex.label}
                                </ToggleGroup.Item>
                            {/each}
                        </ToggleGroup.Root>
                    </div>
                </Card.Content>
            </Card.Root>

            {#if activeProduct === "perfusor"}
                <Card.Root class="overflow-hidden shadow-sm">
                    <Card.Header>
                        <Card.Title>Medikamente</Card.Title>
                        <Card.Description
                            >Laufbahn anpassen und ml/h ablesen</Card.Description
                        >
                    </Card.Header>
                    <Card.Content class="p-0">
                        <Table.Root class="min-w-[42rem]">
                            <Table.Header class="bg-muted/70">
                                <Table.Row>
                                    <Table.Head
                                        class="px-4 py-3 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                                    >
                                        Medikament
                                    </Table.Head>
                                    <Table.Head
                                        class="px-4 py-3 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                                    >
                                        Laufbahn
                                    </Table.Head>
                                    <Table.Head
                                        class="px-4 py-3 text-right text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                                    >
                                        ml/h
                                    </Table.Head>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
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
                                    <Table.Row
                                        class={cn(
                                            "border-l-4 bg-card",
                                            colorClasses[medication.color].row,
                                        )}
                                    >
                                        <Table.Cell
                                            class="px-4 py-4 align-middle"
                                        >
                                            <div
                                                class="flex items-center gap-3"
                                            >
                                                <span
                                                    class={cn(
                                                        "h-3 w-3 shrink-0 rounded-full",
                                                        colorClasses[
                                                            medication.color
                                                        ].dot,
                                                    )}
                                                    aria-hidden="true"
                                                ></span>
                                                <span
                                                    class={cn(
                                                        "font-semibold",
                                                        colorClasses[
                                                            medication.color
                                                        ].text,
                                                    )}
                                                >
                                                    {medication.name}
                                                </span>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell
                                            class="px-4 py-4 align-middle"
                                        >
                                            <Label
                                                class="grid max-w-44 gap-1 text-xs font-medium text-muted-foreground"
                                            >
                                                {formatDoseUnit(
                                                    medication.unit,
                                                )}
                                                <Input
                                                    class="h-11 bg-background text-base font-medium md:text-base"
                                                    inputmode="decimal"
                                                    type="text"
                                                    autocomplete="off"
                                                    placeholder={formatDoseUnit(
                                                        medication.unit,
                                                    )}
                                                    value={doseInputs[
                                                        medication.id
                                                    ] ?? ""}
                                                    aria-label={`${medication.name} Laufbahn`}
                                                    oninput={(
                                                        event: Event & {
                                                            currentTarget: HTMLInputElement;
                                                        },
                                                    ) => {
                                                        doseInputs[
                                                            medication.id
                                                        ] =
                                                            event.currentTarget.value;
                                                    }}
                                                />
                                            </Label>
                                        </Table.Cell>
                                        <Table.Cell
                                            class="px-4 py-4 text-right align-middle"
                                        >
                                            <div
                                                class="text-2xl font-semibold tabular-nums"
                                            >
                                                {formatMlPerHour(mlPerHour)}
                                            </div>
                                            {#if !medication.concentration}
                                                <div
                                                    class="text-xs font-medium text-muted-foreground"
                                                >
                                                    Konzentration fehlt
                                                </div>
                                            {/if}
                                        </Table.Cell>
                                    </Table.Row>
                                {/each}
                            </Table.Body>
                        </Table.Root>
                    </Card.Content>
                </Card.Root>
            {:else if activeProduct === "physiology"}
                <Card.Root class="shadow-sm">
                    <Card.Header>
                        <Card.Title>Berechnete Parameter</Card.Title>
                        <Card.Description
                            >Aus Gewicht, Größe und Geschlecht</Card.Description
                        >
                    </Card.Header>
                    <Card.Content>
                        {@const parsedWeight = parseDecimalInput(
                            patient.weightInput,
                        )}
                        {@const parsedHeight = parseDecimalInput(
                            patient.heightInput,
                        )}
                        {@const idealBodyWeight = calculateIdealBodyWeight({
                            heightCm: parsedHeight,
                            sex: patient.sex,
                        })}
                        {@const bloodVolume = calculateBloodVolumeLiters({
                            weightKg: parsedWeight,
                            sex: patient.sex,
                        })}
                        {@const tidalVolume =
                            calculateTidalVolumeRangeMl(idealBodyWeight)}
                        <div class="grid gap-3 md:grid-cols-3">
                            <div
                                class="rounded-xl border border-border bg-background/70 p-5"
                            >
                                <p
                                    class="text-sm font-medium text-muted-foreground"
                                >
                                    Ideales Körpergewicht
                                </p>
                                <p
                                    class="mt-3 text-3xl font-semibold tabular-nums"
                                >
                                    {formatKg(idealBodyWeight)}
                                </p>
                            </div>

                            <div
                                class="rounded-xl border border-border bg-background/70 p-5"
                            >
                                <p
                                    class="text-sm font-medium text-muted-foreground"
                                >
                                    Blutvolumen · {bloodVolumeMlPerKg[
                                        patient.sex
                                    ]} ml/kg
                                </p>
                                <p
                                    class="mt-3 text-3xl font-semibold tabular-nums"
                                >
                                    {formatLiters(bloodVolume)}
                                </p>
                            </div>

                            <div
                                class="rounded-xl border border-border bg-background/70 p-5"
                            >
                                <p
                                    class="text-sm font-medium text-muted-foreground"
                                >
                                    Atemzugsvolumen · 6-8 ml/kg IBW
                                </p>
                                <p
                                    class="mt-3 text-3xl font-semibold tabular-nums"
                                >
                                    {formatMlRange(tidalVolume)}
                                </p>
                            </div>
                        </div>
                    </Card.Content>
                </Card.Root>
            {:else}
                <Card.Root class="shadow-sm">
                    <Card.Header>
                        <Card.Title>Konzentration</Card.Title>
                        <Card.Description
                            >Ausgangslösung mit NaCl verdünnen</Card.Description
                        >
                    </Card.Header>
                    <Card.Content>
                        {@const sourcePercentage = parseDecimalInput(
                            sourcePercentageInput,
                        )}
                        {@const drugVolumeMl =
                            parseDecimalInput(drugVolumeInput)}
                        {@const diluentVolumeMl =
                            parseDecimalInput(diluentVolumeInput)}
                        {@const targetPercentage = parseDecimalInput(
                            targetPercentageInput,
                        )}
                        {@const sourceMgPerMl =
                            percentageToMilligramPerMl(sourcePercentage)}
                        {@const dilutedConcentration =
                            calculateDilutedConcentration({
                                sourcePercentage,
                                drugVolumeMl,
                                diluentVolumeMl,
                            })}
                        {@const targetMgPerMl =
                            parseDecimalInput(targetMgPerMlInput)}
                        <div
                            class="grid gap-4 md:grid-cols-[minmax(12rem,1fr)_auto_minmax(10rem,0.75fr)_auto_minmax(12rem,1fr)] md:items-start"
                        >
                            <div class="grid gap-2">
                                <p
                                    class="text-sm font-medium text-card-foreground"
                                >
                                    Konzentration
                                </p>
                                <div class="grid gap-2">
                                    <div class="relative">
                                        <Input
                                            class="h-11 bg-background pr-10 text-base font-medium md:text-base"
                                            inputmode="decimal"
                                            type="text"
                                            autocomplete="off"
                                            value={sourcePercentageInput}
                                            aria-label="Ausgangskonzentration in Prozent"
                                            oninput={(
                                                event: Event & {
                                                    currentTarget: HTMLInputElement;
                                                },
                                            ) => {
                                                sourcePercentageInput =
                                                    event.currentTarget.value;
                                                syncConcentrationInputs();
                                            }}
                                        />
                                        <span
                                            class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground"
                                        >
                                            %
                                        </span>
                                    </div>
                                    <div class="relative">
                                        <Input
                                            class="h-11 bg-background pr-10 text-base font-medium md:text-base"
                                            inputmode="decimal"
                                            type="text"
                                            autocomplete="off"
                                            value={drugVolumeInput}
                                            aria-label="Medikament Menge in Milliliter"
                                            oninput={(
                                                event: Event & {
                                                    currentTarget: HTMLInputElement;
                                                },
                                            ) => {
                                                drugVolumeInput =
                                                    event.currentTarget.value;
                                                syncConcentrationInputs();
                                            }}
                                        />
                                        <span
                                            class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground"
                                        >
                                            ml
                                        </span>
                                    </div>
                                </div>
                                <p
                                    class="text-xs font-medium text-muted-foreground"
                                >
                                    {formatConcentrationValue(sourceMgPerMl)} mg/ml
                                </p>
                            </div>

                            <div
                                class="hidden pt-9 text-2xl font-semibold text-muted-foreground md:block"
                            >
                                +
                            </div>

                            <Label
                                class="grid gap-2 text-sm font-medium text-card-foreground"
                            >
                                NaCl
                                <div class="relative">
                                    <Input
                                        class="h-11 bg-background pr-10 text-base font-medium md:text-base"
                                        inputmode="decimal"
                                        type="text"
                                        autocomplete="off"
                                        value={diluentVolumeInput}
                                        aria-label="NaCl Menge in Milliliter"
                                        oninput={(
                                            event: Event & {
                                                currentTarget: HTMLInputElement;
                                            },
                                        ) => {
                                            handleDiluentInput(
                                                event.currentTarget.value,
                                            );
                                        }}
                                    />
                                    <span
                                        class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground"
                                    >
                                        ml
                                    </span>
                                </div>
                            </Label>

                            <div
                                class="hidden pt-9 text-2xl font-semibold text-muted-foreground md:block"
                            >
                                =
                            </div>

                            <div class="grid gap-2">
                                <p
                                    class="text-sm font-medium text-card-foreground"
                                >
                                    Ziel
                                </p>
                                <div class="grid gap-2">
                                    <div class="relative">
                                        <Input
                                            class="h-11 bg-background pr-10 text-base font-medium md:text-base"
                                            inputmode="decimal"
                                            type="text"
                                            autocomplete="off"
                                            value={targetPercentageInput}
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
                                        <span
                                            class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground"
                                        >
                                            %
                                        </span>
                                    </div>
                                    <div class="relative">
                                        <Input
                                            class="h-11 bg-background pr-16 text-base font-medium md:text-base"
                                            inputmode="decimal"
                                            type="text"
                                            autocomplete="off"
                                            value={targetMgPerMlInput}
                                            aria-label="Zielkonzentration in Milligramm pro Milliliter"
                                            oninput={(
                                                event: Event & {
                                                    currentTarget: HTMLInputElement;
                                                },
                                            ) => {
                                                handleTargetMgPerMlInput(
                                                    event.currentTarget.value,
                                                );
                                            }}
                                        />
                                        <span
                                            class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground"
                                        >
                                            mg/ml
                                        </span>
                                    </div>
                                </div>
                                <p
                                    class="text-xs font-medium text-muted-foreground"
                                >
                                    {formatConcentrationValue(
                                        sourcePercentage,
                                    )}% + {formatConcentrationValue(
                                        diluentVolumeMl,
                                    )}
                                    ml NaCl
                                </p>
                            </div>
                        </div>
                    </Card.Content>
                </Card.Root>
            {/if}
        </section>
    </div>
</main>

<nav
    class="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
>
    <div
        class="mx-auto grid max-w-xl grid-cols-3 gap-1 rounded-4xl border border-border/80 bg-background/90 p-1 shadow-lg backdrop-blur"
        aria-label="Produkte"
    >
        {#each products as product}
            <Button
                variant={activeProduct === product.value ? "default" : "ghost"}
                class="h-14 rounded-[1.6rem] text-sm font-semibold"
                aria-current={activeProduct === product.value
                    ? "page"
                    : undefined}
                onclick={() => {
                    activeProduct = product.value;
                }}
            >
                <span class="inline">{product.label}</span>
            </Button>
        {/each}
    </div>
</nav>
