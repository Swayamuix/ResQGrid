"use client";

import { useState } from "react";

type AgentResult = {
  decision?: string | any;
  logs?: any[];
  completedAt?: string;
};

type DispatchResponse = {
  success?: boolean;
  result?: AgentResult;
  error?: string;
};

export default function Home() {
  const [request, setRequest] = useState(
    "Handle a P1 flood emergency from Terminal A to Location B. Select the safest available vehicle and route."
  );

  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runDispatch() {
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("/api/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request,
        }),
      });

      const data: DispatchResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Dispatch failed");
      }

      // Safeguard: handle if data.result is returned or if data is the payload itself
      const outputResult = data.result ?? (data as unknown as AgentResult);
      setResult(outputResult || null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1120",
        color: "#e5e7eb",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid #1f2937",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "26px" }}>
            ResQGrid
          </h1>

          <p
            style={{
              margin: "5px 0 0",
              color: "#94a3b8",
              fontSize: "14px",
            }}
          >
            AI Emergency Dispatch & Route Engine
          </p>
        </div>

        <div
          style={{
            background: "#052e16",
            color: "#4ade80",
            padding: "8px 14px",
            borderRadius: "20px",
            fontSize: "13px",
          }}
        >
          ● AI Agent Online
        </div>
      </header>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "30px 20px",
        }}
      >
        {/* Emergency request */}
        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Emergency Dispatch
          </h2>

          <p style={{ color: "#94a3b8" }}>
            Give the emergency request to the Agent. The Agent
            will evaluate the dispatch situation.
          </p>

          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#0f172a",
              color: "#e5e7eb",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "14px",
              resize: "vertical",
              fontSize: "14px",
            }}
          />

          <button
            onClick={runDispatch}
            disabled={loading || !request.trim()}
            style={{
              marginTop: "16px",
              padding: "12px 22px",
              borderRadius: "8px",
              border: "none",
              background: loading ? "#475569" : "#2563eb",
              color: "white",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "AI Agent Analyzing..." : "Run AI Dispatch"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#450a0a",
              color: "#fca5a5",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* Agent decision */}
        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            🤖 AI Dispatch Decision
          </h2>

          {!result && !loading && (
            <p style={{ color: "#64748b" }}>
              No dispatch decision yet.
            </p>
          )}

          {loading && (
            <p style={{ color: "#60a5fa" }}>
              Agent is checking vehicles, routes and risk data...
            </p>
          )}

          {result && (
            <>
              {/* Decision */}
              <div
                style={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  padding: "20px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "12px",
                    marginBottom: "8px",
                  }}
                >
                  FINAL AGENT DECISION
                </div>

                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.7,
                    fontSize: "14px",
                    fontFamily: "monospace",
                  }}
                >
                  {typeof result.decision === "string"
                    ? result.decision
                    : JSON.stringify(result.decision, null, 2)}
                </div>
              </div>

              {/* Agent logs */}
              {Array.isArray(result.logs) && result.logs.length > 0 && (
                <div
                  style={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "10px",
                    padding: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>
                    Agent Activity
                  </h3>

                  <ol
                    style={{
                      paddingLeft: "20px",
                      lineHeight: 1.8,
                    }}
                  >
                    {result.logs.map((log, index) => (
                      <li key={index}>
                        {typeof log === "string" ? log : JSON.stringify(log)}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Completed time */}
              {result.completedAt && (
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  Completed: {String(result.completedAt)}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}