export function getWaterLevel(routeId: string) {
  // Mock data mapping route IDs to flood water levels in feet
  const levels: Record<string, { waterLevelFeet: number; status: string }> = {
    A: { waterLevelFeet: 1.2, status: "Passable" },
    B: { waterLevelFeet: 4.8, status: "Flooded / Dangerous" },
    C: { waterLevelFeet: 0.5, status: "Clear" },
  };

  const id = routeId.toUpperCase().replace("ROUTE", "").trim();
  const routeData = levels[id] || { waterLevelFeet: 0.0, status: "Unknown" };

  return {
    routeId,
    waterLevelFeet: routeData.waterLevelFeet,
    status: routeData.status,
  };
}