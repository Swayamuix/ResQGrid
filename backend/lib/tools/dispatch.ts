import { GoogleGenAI } from "@google/genai";

import { getAvailableVehicles } from "./tools/vehicles";
import { getRouteOptions } from "./tools/routes";
import { getWaterLevel } from "./tools/water-level";
import { getThreatLevel } from "./tools/threat-level";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Tool definitions given to Gemini
const tools = [
  {
    functionDeclarations: [
      {
        name: "get_available_vehicles",
        description:
          "Find available rescue vehicles near the emergency location.",
        parameters: {
          type: "OBJECT",
          properties: {
            location: {
              type: "STRING",
              description: "Location of the emergency",
            },
          },
          required: ["location"],
        },
      },

      {
        name: "get_route_options",
        description:
          "Find possible routes between the origin and destination.",
        parameters: {
          type: "OBJECT",
          properties: {
            origin: {
              type: "STRING",
              description: "Starting point",
            },
            destination: {
              type: "STRING",
              description: "Emergency destination",
            },
          },
          required: ["origin", "destination"],
        },
      },

      {
        name: "get_water_level",
        description:
          "Check the current flood water level of a route in feet.",
        parameters: {
          type: "OBJECT",
          properties: {
            routeId: {
              type: "STRING",
              description: "Route ID such as A, B or C",
            },
          },
          required: ["routeId"],
        },
      },

      {
        name: "get_threat_level",
        description:
          "Check the current threat level of a route.",
        parameters: {
          type: "OBJECT",
          properties: {
            routeId: {
              type: "STRING",
              description: "Route ID such as A, B or C",
            },
          },
          required: ["routeId"],
        },
      },
    ],
  },
];

export async function dispatchAgent(userRequest: string) {
  const contents: any[] = [
    {
      role: "user",
      parts: [
        {
          text: userRequest,
        },
      ],
    },
  ];

  // Allow the agent to make multiple tool calls
  for (let step = 0; step < 6; step++) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",

      contents,

      config: {
        systemInstruction: `
You are the ResQGrid Dispatch & Route Agent.

Your job is to make safe emergency dispatch decisions.

For every emergency:

1. Identify the emergency priority.
2. Check available vehicles.
3. Check available routes.
4. Check water levels for relevant routes.
5. Check threat levels for relevant routes.
6. Avoid HIGH threat routes whenever possible.
7. Safety is more important than distance.
8. Select the most suitable available vehicle.
9. Select the safest feasible route.
10. Never invent vehicle, route, water-level or threat information.

You can use the provided tools to obtain information.

After collecting enough information, return a final recommendation containing:

- Emergency priority
- Recommended vehicle
- Recommended route
- Water level
- Threat level
- Reason for the decision

Be concise and clear.
        `,

        tools,
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];

    // Check whether Gemini wants to call any tools
    const functionCalls = parts.filter(
      (part: any) => part.functionCall
    );

    // No tool call means the agent has reached its final answer
    if (functionCalls.length === 0) {
      return response.text;
    }

    // Add Gemini's response to conversation
    contents.push({
      role: "model",
      parts,
    });

    const toolResponses = [];

    // Execute every requested tool
    for (const part of functionCalls) {
      const functionCall = part.functionCall;

      if (!functionCall?.name) {
        continue;
      }

      const args = functionCall.args ?? {};

      let result: unknown;

      switch (functionCall.name) {
        case "get_available_vehicles":
          result = getAvailableVehicles(
            String(args.location ?? "")
          );
          break;

        case "get_route_options":
          result = getRouteOptions(
            String(args.origin ?? ""),
            String(args.destination ?? "")
          );
          break;

        case "get_water_level":
          result = getWaterLevel(
            String(args.routeId ?? "")
          );
          break;

        case "get_threat_level":
          result = getThreatLevel(
            String(args.routeId ?? "")
          );
          break;

        default:
          result = {
            error: `Unknown tool: ${functionCall.name}`,
          };
      }

      console.log(
        `Tool called: ${functionCall.name}`,
        args
      );

      toolResponses.push({
        functionResponse: {
          name: functionCall.name,
          response: result,
        },
      });
    }

    // Send tool results back to Gemini
    contents.push({
      role: "user",
      parts: toolResponses,
    });
  }

  return "Agent could not complete the dispatch decision.";
}