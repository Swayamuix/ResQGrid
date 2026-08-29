import { NextRequest, NextResponse } from "next/server";
import { dispatchAgent } from "../../../lib/ai/dispatch-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.request) {
      return NextResponse.json(
        {
          success: false,
          error: "Request is required",
        },
        { status: 400 }
      );
    }

    console.log("Dispatch request:", body.request);

    const result = await dispatchAgent(body.request);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Agent error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}