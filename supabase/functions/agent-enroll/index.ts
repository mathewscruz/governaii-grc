import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  enrollment_token: z.string().min(20).max(200),
  hostname: z.string().min(1).max(255),
  os: z.string().max(64).optional(),
  os_version: z.string().max(64).optional(),
  agent_version: z.string().max(32).optional(),
  mac_addresses: z.array(z.string().max(64)).max(16).optional(),
  serial_number: z.string().max(128).optional(),
  manufacturer: z.string().max(128).optional(),
  model: z.string().max(128).optional(),
});

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateAgentToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `AKA-${hex}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "invalid_payload", details: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const tokenHash = await sha256Hex(body.enrollment_token);
    const { data: tokenRow, error: tokenErr } = await supabase
      .from("endpoint_enrollment_tokens")
      .select("id, empresa_id, expira_em, max_usos, usos, revogado")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (tokenErr || !tokenRow) {
      return new Response(JSON.stringify({ error: "invalid_token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (tokenRow.revogado) {
      return new Response(JSON.stringify({ error: "token_revoked" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (tokenRow.expira_em && new Date(tokenRow.expira_em) < new Date()) {
      return new Response(JSON.stringify({ error: "token_expired" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (tokenRow.max_usos && tokenRow.usos >= tokenRow.max_usos) {
      return new Response(JSON.stringify({ error: "token_exhausted" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const empresaId = tokenRow.empresa_id;

    // create ativo (tipo endpoint) for this device
    const { data: ativo, error: ativoErr } = await supabase
      .from("ativos")
      .insert({
        empresa_id: empresaId,
        nome: body.hostname,
        tipo: "endpoint",
        descricao: [body.manufacturer, body.model, body.os, body.os_version].filter(Boolean).join(" "),
        status: "ativo",
        criticidade: "medio",
        fornecedor: body.manufacturer ?? null,
        versao: body.os_version ?? null,
        tags: [body.serial_number ? `SN:${body.serial_number}` : null, "EndpointAgent"].filter(Boolean) as string[],
      })
      .select("id")
      .single();

    if (ativoErr) {
      console.error("ativo insert error", ativoErr);
      return new Response(JSON.stringify({ error: "internal_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const agentToken = generateAgentToken();
    const agentTokenHash = await sha256Hex(agentToken);

    const { data: agent, error: agentErr } = await supabase
      .from("endpoint_agents")
      .insert({
        empresa_id: empresaId,
        ativo_id: ativo.id,
        agent_token_hash: agentTokenHash,
        hostname: body.hostname,
        so: body.os ?? null,
        so_versao: body.os_version ?? null,
        versao_agente: body.agent_version ?? null,
        mac_addresses: body.mac_addresses ?? null,
        status: "online",
        ultimo_checkin: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (agentErr) {
      console.error("agent insert error", agentErr);
      return new Response(JSON.stringify({ error: "internal_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("endpoint_enrollment_tokens")
      .update({ usos: tokenRow.usos + 1 })
      .eq("id", tokenRow.id);

    return new Response(
      JSON.stringify({
        agent_id: agent.id,
        agent_token: agentToken,
        checkin_interval_seconds: 3600,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("agent-enroll error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
