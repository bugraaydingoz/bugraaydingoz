<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
    import { patient, type PatientSex } from "$lib/patient-state.svelte";
    import type { PatientGroup } from "$lib/perfusor";

    const patientGroups = [
        { value: "adult", label: "Erwachsener" },
        { value: "child", label: "Kind" },
    ] satisfies Array<{ value: PatientGroup; label: string }>;

    const patientSexes = [
        { value: "female", label: "Weiblich" },
        { value: "male", label: "Männlich" },
    ] satisfies Array<{ value: PatientSex; label: string }>;
</script>

<Card.Root class="shadow-sm">
    <Card.Header>
        <Card.Title>Patient</Card.Title>
        <Card.Description>Gemeinsame Patientendaten</Card.Description>
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
                    <ToggleGroup.Item value={group.value} class="w-full">
                        {group.label}
                    </ToggleGroup.Item>
                {/each}
            </ToggleGroup.Root>
        </div>

        <Label class="grid gap-2 text-sm font-medium text-card-foreground">
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

        <Label class="grid gap-2 text-sm font-medium text-card-foreground">
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
            <p class="text-sm font-medium text-card-foreground">Geschlecht</p>
            <ToggleGroup.Root
                type="single"
                bind:value={patient.sex}
                variant="outline"
                spacing={1}
                class="grid w-full grid-cols-2"
            >
                {#each patientSexes as sex}
                    <ToggleGroup.Item value={sex.value} class="w-full">
                        {sex.label}
                    </ToggleGroup.Item>
                {/each}
            </ToggleGroup.Root>
        </div>
    </Card.Content>
</Card.Root>
