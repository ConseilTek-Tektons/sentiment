export type CohortMetric = {
  cohort: string;
  respondents: number;
  score: number;
  change: number;
};

export type VisibleCohortMetric = CohortMetric & {
  masked: boolean;
  visibleScore: number | null;
  visibleChange: number | null;
};

export function enforceAnonymityThreshold(
  metric: CohortMetric,
  minimumRespondents: number,
): VisibleCohortMetric {
  const masked = metric.respondents < minimumRespondents;
  return {
    ...metric,
    masked,
    visibleScore: masked ? null : metric.score,
    visibleChange: masked ? null : metric.change,
  };
}

export function visibleCohorts(metrics: CohortMetric[], minimumRespondents: number) {
  return metrics.map((metric) => enforceAnonymityThreshold(metric, minimumRespondents));
}
