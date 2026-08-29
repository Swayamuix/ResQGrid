export function getRouteOptions(
  origin: string,
  destination: string
) {
  return {
    origin,
    destination,
    routes: [
      {
        id: "A",
        name: "Route A",
        distanceKm: 15,
        estimatedMinutes: 30,
      },
      {
        id: "B",
        name: "Route B",
        distanceKm: 20,
        estimatedMinutes: 38,
      },
      {
        id: "C",
        name: "Route C",
        distanceKm: 18,
        estimatedMinutes: 35,
      },
    ],
  };
} 