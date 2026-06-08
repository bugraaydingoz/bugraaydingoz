<script lang="ts">
	import {
		calculateMlPerHour,
		getDefaultDoseInputs,
		medications,
		parseDecimalInput,
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
		<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div class="space-y-1">
				<p class="text-sm font-semibold tracking-[0.18em] text-primary uppercase">MyAnästhesie</p>
				<h1 class="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
					Perfusoren Rechner
				</h1>
				<p class="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
					Schnelle Laufbahn-Berechnung für Perfusorspritzpumpen. Werte prüfen und lokal
					anpassen.
				</p>
			</div>

			<div
				class="inline-flex rounded-lg border border-border bg-card p-1 shadow-sm"
				aria-label="Patientengruppe"
			>
				{#each patientGroups as group}
					<button
						type="button"
						class={cn(
							'min-h-11 rounded-md px-4 text-sm font-semibold transition-colors',
							patientGroup === group.value
								? 'bg-primary text-primary-foreground shadow-sm'
								: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
						)}
						aria-pressed={patientGroup === group.value}
						onclick={() => {
							patientGroup = group.value;
						}}
					>
						{group.label}
					</button>
				{/each}
			</div>
		</header>

		<section class="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
			<div class="rounded-lg border border-border bg-card p-4 shadow-sm">
				<label class="grid gap-2 text-sm font-medium text-card-foreground">
					Gewicht
					<div class="relative">
						<input
							class="h-14 w-full rounded-lg border border-input bg-background px-4 pr-12 text-2xl font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
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
				</label>

				<div class="mt-4 rounded-lg bg-muted p-3 text-sm leading-5 text-muted-foreground">
					Noradrenalin nutzt aktuell die globale Konzentration
					<span class="font-semibold text-foreground">1 ml = 10 µg</span>.
				</div>
			</div>

			<div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
				<div class="overflow-x-auto">
					<table class="w-full min-w-[46rem] border-collapse text-left">
						<thead
							class="bg-muted/70 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
						>
							<tr>
								<th class="px-4 py-3">Medikament</th>
								<th class="px-4 py-3">Laufbahn</th>
								<th class="px-4 py-3">Einheit</th>
								<th class="px-4 py-3 text-right">ml/h</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each medications as medication}
								{@const parsedDose = parseDecimalInput(doseInputs[medication.id] ?? '')}
								{@const parsedWeight = parseDecimalInput(weightInput)}
								{@const mlPerHour = calculateMlPerHour({
									dose: parsedDose,
									weightKg: parsedWeight,
									medication,
								})}
								<tr class={cn('border-l-4 bg-card', colorClasses[medication.color].row)}>
									<td class="px-4 py-4 align-middle">
										<div class="flex items-center gap-3">
											<span
												class={cn('h-3 w-3 shrink-0 rounded-full', colorClasses[medication.color].dot)}
												aria-hidden="true"
											></span>
											<span class={cn('font-semibold', colorClasses[medication.color].text)}>
												{medication.name}
											</span>
										</div>
									</td>
									<td class="px-4 py-4 align-middle">
										<input
											class="h-11 w-28 rounded-md border border-input bg-background px-3 text-base font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
											inputmode="decimal"
											type="text"
											autocomplete="off"
											value={doseInputs[medication.id] ?? ''}
											aria-label={`${medication.name} Laufbahn`}
											oninput={(event) => {
												doseInputs[medication.id] = event.currentTarget.value;
											}}
										/>
									</td>
									<td
										class="px-4 py-4 align-middle text-sm font-medium whitespace-nowrap text-muted-foreground"
									>
										{medication.unit}
									</td>
									<td class="px-4 py-4 text-right align-middle">
										<div class="text-2xl font-semibold tabular-nums">
											{formatMlPerHour(mlPerHour)}
										</div>
										{#if !medication.concentration}
											<div class="text-xs font-medium text-muted-foreground">
												Konzentration fehlt
											</div>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	</div>
</main>
