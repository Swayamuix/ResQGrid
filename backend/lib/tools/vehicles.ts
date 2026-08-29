export function getAvailableVehicles(location: string) {
  return {
    location,
    vehicles: [
      {
        id: "V12",
        type: "Heavy Rescue Truck",
        capacity: "High",
        distanceKm: 5,
        available: true,
      },
      {
        id: "V15",
        type: "Rescue Van",
        capacity: "Medium",
        distanceKm: 8,
        available: true,
      },
      {
        id: "V21",
        type: "Heavy Rescue Truck",
        capacity: "High",
        distanceKm: 12,
        available: false,
      },
    ],
  };
} 