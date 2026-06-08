export function percentageToMilligramPerMl(percentage: number | null) {
  if (percentage === null || percentage < 0) {
    return null;
  }

  return percentage * 10;
}

export function calculateDilutedConcentration({
  sourcePercentage,
  drugVolumeMl,
  diluentVolumeMl,
}: {
  sourcePercentage: number | null;
  drugVolumeMl: number | null;
  diluentVolumeMl: number | null;
}) {
  if (
    sourcePercentage === null ||
    drugVolumeMl === null ||
    diluentVolumeMl === null ||
    sourcePercentage < 0 ||
    drugVolumeMl <= 0 ||
    diluentVolumeMl < 0
  ) {
    return null;
  }

  const sourceMgPerMl = percentageToMilligramPerMl(sourcePercentage);

  if (sourceMgPerMl === null) {
    return null;
  }

  const totalVolumeMl = drugVolumeMl + diluentVolumeMl;

  if (totalVolumeMl <= 0) {
    return null;
  }

  const resultMgPerMl = (sourceMgPerMl * drugVolumeMl) / totalVolumeMl;

  return {
    percentage: resultMgPerMl / 10,
    milligramPerMl: resultMgPerMl,
  };
}

export function calculateRequiredDiluentVolume({
  sourcePercentage,
  drugVolumeMl,
  targetPercentage,
}: {
  sourcePercentage: number | null;
  drugVolumeMl: number | null;
  targetPercentage: number | null;
}) {
  if (
    sourcePercentage === null ||
    drugVolumeMl === null ||
    targetPercentage === null ||
    sourcePercentage < 0 ||
    drugVolumeMl <= 0 ||
    targetPercentage <= 0
  ) {
    return null;
  }

  const sourceMgPerMl = percentageToMilligramPerMl(sourcePercentage);
  const targetMgPerMl = percentageToMilligramPerMl(targetPercentage);

  if (sourceMgPerMl === null || targetMgPerMl === null) {
    return null;
  }

  const totalDrugMg = sourceMgPerMl * drugVolumeMl;
  const finalVolumeMl = totalDrugMg / targetMgPerMl;
  const diluentVolumeMl = finalVolumeMl - drugVolumeMl;

  return diluentVolumeMl >= 0 ? diluentVolumeMl : null;
}
