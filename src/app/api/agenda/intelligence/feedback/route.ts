import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.EDI_INTELLIGENCE_API_URL;

const ALLOWED_OUTCOMES = new Set([
  "accepted",
  "rejected",
  "ignored",
  "edited",
  "executed",
  "positive",
  "neutral",
  "negative",
]);

export async function POST(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json(
      { error: "Serviço de inteligência não configurado." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Payload de feedback inválido." },
      { status: 400 },
    );
  }

  const outcome = typeof body.outcome === "string" ? body.outcome : null;

  if (!outcome || !ALLOWED_OUTCOMES.has(outcome)) {
    return NextResponse.json(
      { error: "Resultado de feedback inválido." },
      { status: 400 },
    );
  }

  const payload = {
    recommendation_id:
      typeof body.recommendation_id === "string"
        ? body.recommendation_id
        : undefined,
    recommendation_type:
      typeof body.recommendation_type === "string"
        ? body.recommendation_type
        : undefined,
    module: "agenda",
    context_type:
      typeof body.context_type === "string" ? body.context_type : undefined,
    outcome,
    executed: typeof body.executed === "boolean" ? body.executed : undefined,
    result:
      body.result === "positive" ||
      body.result === "neutral" ||
      body.result === "negative"
        ? body.result
        : undefined,
  };

  const response = await fetch(`${API_URL}/api/v1/intelligence/agenda/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({
    error: "Resposta inválida do serviço de inteligência.",
  }));

  return NextResponse.json(data, { status: response.status });
}
