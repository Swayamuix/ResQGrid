export function getThreatLevel(routeId: string) {
  const threatLevels: Record<string, string> = {
    A: "HIGH",
    B: "LOW",
    C: "MEDIUM",
  };

  return {
    routeId,
    threatLevel: threatLevels[routeId] ?? "UNKNOWN",
  };
}