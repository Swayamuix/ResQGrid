import { NextResponse } from "next/server";
import { dispatchAgent } from "@/lib/ai/dispatch-agent";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt =
      body.prompt ||
      body.request ||
      "Handle the emergency dispatch request.";

    const result = await dispatchAgent(prompt);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Dispatch Agent Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Dispatch agent failed",
      },
      { status: 500 }
    );
  }
}