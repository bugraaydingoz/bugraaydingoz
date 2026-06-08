<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import UnitInput from "$lib/components/app/unit-input.svelte";
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

        <div class="grid grid-cols-2 gap-3">
            <Label class="grid gap-2 text-sm font-medium text-card-foreground">
                Gewicht
                <UnitInput
                    bind:value={patient.weightInput}
                    unit="kg"
                    aria-label="Gewicht in Kilogramm"
                />
            </Label>

            <Label class="grid gap-2 text-sm font-medium text-card-foreground">
                Größe
                <UnitInput
                    bind:value={patient.heightInput}
                    unit="cm"
                    aria-label="Größe in Zentimeter"
                />
            </Label>
        </div>
    </Card.Content>
</Card.Root>
