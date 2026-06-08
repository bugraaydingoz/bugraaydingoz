<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import { patient } from "$lib/patient-state.svelte";
    import { parseDecimalInput } from "$lib/perfusor";
    import {
        bloodVolumeMlPerKg,
        calculateBloodVolumeLiters,
        calculateIdealBodyWeight,
        calculateTidalVolumeRangeMl,
    } from "$lib/physiology";

    const oneDecimalFormatter = new Intl.NumberFormat("de-DE", {
        maximumFractionDigits: 1,
        minimumFractionDigits: 0,
    });

    const integerFormatter = new Intl.NumberFormat("de-DE", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    });

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
</script>

<Card.Root class="shadow-sm">
    <Card.Header>
        <Card.Title>Berechnete Parameter</Card.Title>
        <Card.Description>Aus Gewicht, Größe und Geschlecht</Card.Description>
    </Card.Header>
    <Card.Content>
        {@const parsedWeight = parseDecimalInput(patient.weightInput)}
        {@const parsedHeight = parseDecimalInput(patient.heightInput)}
        {@const idealBodyWeight = calculateIdealBodyWeight({
            heightCm: parsedHeight,
            sex: patient.sex,
        })}
        {@const bloodVolume = calculateBloodVolumeLiters({
            weightKg: parsedWeight,
            sex: patient.sex,
        })}
        {@const tidalVolume = calculateTidalVolumeRangeMl(idealBodyWeight)}
        <div class="grid gap-3 md:grid-cols-3">
            <div class="rounded-xl border border-border bg-background/70 p-5">
                <p class="text-sm font-medium text-muted-foreground">
                    Ideales Körpergewicht
                </p>
                <p class="mt-3 text-3xl font-semibold tabular-nums">
                    {formatKg(idealBodyWeight)}
                </p>
            </div>

            <div class="rounded-xl border border-border bg-background/70 p-5">
                <p class="text-sm font-medium text-muted-foreground">
                    Blutvolumen · {bloodVolumeMlPerKg[patient.sex]} ml/kg
                </p>
                <p class="mt-3 text-3xl font-semibold tabular-nums">
                    {formatLiters(bloodVolume)}
                </p>
            </div>

            <div class="rounded-xl border border-border bg-background/70 p-5">
                <p class="text-sm font-medium text-muted-foreground">
                    Atemzugsvolumen · 6-8 ml/kg IBW
                </p>
                <p class="mt-3 text-3xl font-semibold tabular-nums">
                    {formatMlRange(tidalVolume)}
                </p>
            </div>
        </div>
    </Card.Content>
</Card.Root>
