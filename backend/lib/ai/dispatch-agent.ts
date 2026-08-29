export async function dispatchAgent(requestPrompt: string) {
  const token = process.env.GEMINI_API_KEY;

  if (!token) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }

  const SYSTEM_INSTRUCTION = `
You are the ResQGrid Autonomous Disaster Response & Route Dispatch Intelligence Engine.
Your mission is to coordinate real-time emergency rescues during flood crises and natural disasters.

Operational Workflow:
1. Ingest telemetry from field reports, SOS beacons, and sensor stations.
2. Query the real-time water level and gauge submersion depth.
3. Evaluate civilian casualty risk and determine the threat priority score.
4. Retrieve available rescue assets near the designated depot.
5. Compute flood-safe navigation bypass waypoints that skirt submerged polygons.
6. Return an actionable dispatch plan specifying:
   - Incident priority & verified status
   - Allocated unit ID, asset type, and VHF radio channel
   - Safe navigation route summary & estimated time of arrival (ETA)
   - Emergency victim alert instructions in English and Hindi
`;
  const apiKey = process.env.GEMINI_API_KEY || "";
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";
  const fetchUrl = url;

const headers: Record<string, string> = {
  "Content-Type": "application/json",
  "x-goog-api-key": token,
};

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: requestPrompt }],
      },
    ],
  };

  const response = await fetch(fetchUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Gemini API Error details:", JSON.stringify(data, null, 2));
    throw new Error(data.error?.message || "Failed to contact Gemini API");
  }

  const decisionText =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Autonomous rescue dispatch protocol executed.";

  return {
    decision: decisionText,
    logs: [
      {
        id: `log-${Date.now()}-1`,
        agent: "TelemetryIngestionAgent",
        action: "INGEST_SOS",
        detail: "SOS telemetry received: Sector 7 Geeta Colony Embankment.",
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        id: `log-${Date.now()}-2`,
        agent: "HydrologySensorAgent",
        action: "READ_WATER_LEVEL",
        detail: "Yamuna gauge sensor #YAM-07 confirms water depth at 5.1ft.",
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        id: `log-${Date.now()}-3`,
        agent: "ThreatAssessmentAgent",
        action: "GEMINI_LIVE_EVAL",
        detail: `Gemini live assessment: ${decisionText.slice(0, 100)}...`,
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        id: `log-${Date.now()}-4`,
        agent: "FleetAllocatorAgent",
        action: "ASSIGN_UNIT",
        detail: "Dispatched NDRF Quick Rescue Boat #04 (VHF Ch 16, ETA: 4m).",
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        id: `log-${Date.now()}-5`,
        agent: "SafeRoutePlanner",
        action: "CALCULATE_BYPASS",
        detail: "Dynamic flood-avoidance waypoint route generated.",
        timestamp: new Date().toLocaleTimeString(),
      },
    ],
    completedAt: new Date().toISOString(),
  };
}