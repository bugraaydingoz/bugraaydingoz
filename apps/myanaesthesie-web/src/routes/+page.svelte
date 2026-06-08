<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import {
		calculateMlPerHour,
		getDefaultDoseInputs,
		medications,
		parseDecimalInput,
		type DoseUnit,
		type MedicationColor,
		type PatientGroup,
	} from '$lib/perfusor';
	import { cn } from '$lib/utils';

	const patientGroups = [
		{ value: 'adult', label: 'Erwachsener' },
		{ value: 'child', label: 'Kind' },
	] satisfies Array<{ value: PatientGroup; label: string }>;

	const colorClasses: Record<MedicationColor, { dot: string; text: string; row: string }> = {
		purple: {
			dot: 'bg-purple-500',
			text: 'text-purple-700',
			row: 'border-l-purple-500',
		},
		blue: {
			dot: 'bg-blue-500',
			text: 'text-blue-700',
			row: 'border-l-blue-500',
		},
		yellow: {
			dot: 'bg-yellow-400',
			text: 'text-yellow-700',
			row: 'border-l-yellow-400',
		},
		red: {
			dot: 'bg-red-500',
			text: 'text-red-700',
			row: 'border-l-red-500',
		},
		black: {
			dot: 'bg-neutral-950',
			text: 'text-neutral-950',
			row: 'border-l-neutral-950',
		},
	};

	let patientGroup = $state<PatientGroup>('adult');
	let weightInput = $state('80');
	let doseInputs = $state<Record<string, string>>(getDefaultDoseInputs('adult'));

	$effect(() => {
		doseInputs = getDefaultDoseInputs(patientGroup);
	});

	const numberFormatter = new Intl.NumberFormat('de-DE', {
		maximumFractionDigits: 2,
		minimumFractionDigits: 0,
	});

	function formatMlPerHour(value: number | null) {
		return value === null ? '-' : numberFormatter.format(value);
	}

	function formatDoseUnit(unit: DoseUnit) {
		return unit.replace('microg', 'µg');
	}
</script>

<svelte:head>
	<title>Perfusoren Rechner | MyAnästhesie</title>
	<meta
		name="description"
		content="Mobiler Perfusoren Rechner fuer Anaesthesie mit Offline-Unterstuetzung."
	/>
</svelte:head>

<main
	class="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(174_68%_92%),transparent_34rem),linear-gradient(180deg,hsl(180_35%_98%),hsl(176_38%_95%))] px-4 py-5 text-foreground sm:px-6 lg:px-8"
>
	<div class="mx-auto flex w-full max-w-6xl flex-col gap-5">
		<header class="space-y-1">
			<p class="text-sm font-semibold tracking-[0.18em] text-primary uppercase">MyAnästhesie</p>
			<h1 class="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
				Perfusoren Rechner
			</h1>
			<p class="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
				Schnelle Laufbahn-Berechnung für Perfusorspritzpumpen. Werte prüfen und lokal
				anpassen.
			</p>
		</header>

		<section class="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
			<Card.Root class="shadow-sm">
				<Card.Header>
					<Card.Title>Patient</Card.Title>
					<Card.Description>Gewicht und Patientengruppe</Card.Description>
				</Card.Header>
				<Card.Content class="grid gap-4">
					<div class="grid gap-2">
						<p class="text-sm font-medium text-card-foreground">Patientengruppe</p>
						<ToggleGroup.Root
							type="single"
							bind:value={patientGroup}
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
								bind:value={weightInput}
								aria-label="Gewicht in Kilogramm"
							/>
							<span
								class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold text-muted-foreground"
							>
								kg
							</span>
						</div>
					</Label>
				</Card.Content>
			</Card.Root>

			<Card.Root class="overflow-hidden shadow-sm">
				<Card.Header>
					<Card.Title>Medikamente</Card.Title>
					<Card.Description>Laufbahn anpassen und ml/h ablesen</Card.Description>
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
								{@const parsedDose = parseDecimalInput(doseInputs[medication.id] ?? '')}
								{@const parsedWeight = parseDecimalInput(weightInput)}
								{@const mlPerHour = calculateMlPerHour({
									dose: parsedDose,
									weightKg: parsedWeight,
									medication,
								})}
								<Table.Row class={cn('border-l-4 bg-card', colorClasses[medication.color].row)}>
									<Table.Cell class="px-4 py-4 align-middle">
										<div class="flex items-center gap-3">
											<span
												class={cn('h-3 w-3 shrink-0 rounded-full', colorClasses[medication.color].dot)}
												aria-hidden="true"
											></span>
											<span class={cn('font-semibold', colorClasses[medication.color].text)}>
												{medication.name}
											</span>
										</div>
									</Table.Cell>
									<Table.Cell class="px-4 py-4 align-middle">
										<Label class="grid max-w-44 gap-1 text-xs font-medium text-muted-foreground">
											{formatDoseUnit(medication.unit)}
											<Input
												class="h-11 bg-background text-base font-medium md:text-base"
												inputmode="decimal"
												type="text"
												autocomplete="off"
												placeholder={formatDoseUnit(medication.unit)}
												value={doseInputs[medication.id] ?? ''}
												aria-label={`${medication.name} Laufbahn`}
												oninput={(event: Event & { currentTarget: HTMLInputElement }) => {
													doseInputs[medication.id] = event.currentTarget.value;
												}}
											/>
										</Label>
									</Table.Cell>
									<Table.Cell class="px-4 py-4 text-right align-middle">
										<div class="text-2xl font-semibold tabular-nums">
											{formatMlPerHour(mlPerHour)}
										</div>
										{#if !medication.concentration}
											<div class="text-xs font-medium text-muted-foreground">
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
		</section>
	</div>
</main>
