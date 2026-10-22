export type ReadinessSignal = {
  name: string;
  score: number;
  maximum: number;
  evidence: string[];
};

export type ReadinessResult = {
  signals: ReadinessSignal[];
  totalScore: number;
  label: string;
};
