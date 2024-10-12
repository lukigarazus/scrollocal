export const pickRandom = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const handleFrequencies = <T>(
  arr: { frequency: number; value: T }[],
  // @ts-ignore
): T => {
  let total = 0;
  for (const entry of arr) {
    total += entry.frequency;
  }

  const withNormalizedFrequency = arr.map((entry) => {
    return {
      ...entry,
      normalizedFrequency: entry.frequency / total,
    };
  });

  let random = Math.random();
  for (const entry of withNormalizedFrequency) {
    random -= entry.normalizedFrequency;
    if (random <= 0) {
      return entry.value;
    }
  }
};
