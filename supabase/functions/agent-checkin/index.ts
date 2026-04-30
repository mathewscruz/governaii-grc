import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-agent-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const HardwareSchema = z.object({
  cpu: z.string().max(200).optional(),
  cpu_cores: z.number().int().nonnegative().optional(),
  ram_total_mb: z.number().int().nonnegative().optional(),
  disks: z.array(z.object({
    name: z.string().max(128),
    total_gb: z.number().nonnegative(),
    free_gb: z.number().nonnegative(),
  })).max(32).optional(),
  serial_number: z.string().max(128).optional(),
  manufacturer: z.string().max(128).optional(),
  model: z.string().max(128).optional(),
}).optional();

const SecurityPostureSchema = z.object({
  bitlocker_enabled: z.boolean().optional(),
  antivirus_name: z.string().max(128).optional(),
  antivirus_enabled: z.boolean().optional(),
  firewall_enabled: z.boolean().optional(),
  pending_updates: z.number().int().nonnegative().optional(),
  last_patch_date: z.string().optional(),
  uac_enabled: z.boolean().optional(),
  secure_boot: z.boolean().optional(),
}).optional();

const BodySchema = z.object({
  hostname: z.string().min(1).max(255),
  os: z.string().max(64).optional(),
  os_version: z.string().max(64).optional(),
  agent_version: z.string().max(32).optional(),
  logged_user: z.string().max(255).optional(),
  ip_addresses: z.array(z.string().max(64)).max(16).optional(),
  mac_addresses: z.array(z.string().max(64)).max(16).optional(),
  hardware: HardwareSchema,
  software: z.array(z.object({
    name: z.string().max(255),
    version: z.string().max(64).optional(),
    publisher: z.string().max(255).optional(),
  })).max(2000).optional(),
  security: SecurityPostureSchema,
  open_ports: z.array(z.number().int().nonnegative()).max(256).optional(),
});

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const agentToken = req.headers.get("x-agent-token");
    if (!agentToken) {
      return new Response(JSON.stringify({ error: "missing_token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "invalid_payload", details: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const payload = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const tokenHash = await sha256Hex(agentToken);
    const { data: agent, error: agentErr } = await supabase
      .from("endpoint_agents")
      .select("id, empresa_id, ativo_id, revogado")
      .eq("agent_token_hash", tokenHash)
      .maybeSingle();

    if (agentErr || !agent) {
      return new Response(JSON.stringify({ error: "invalid_agent_token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (agent.revogado) {
      return new Response(JSON.stringify({ error: "agent_revoked" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ipPublico = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || null;
    const payloadStr = JSON.stringify(payload);
    const payloadHash = await sha256Hex(payloadStr);

    const posturaResumo = {
      bitlocker: payload.security?.bitlocker_enabled ?? null,
      antivirus: payload.security?.antivirus_enabled ?? null,
      firewall: payload.security?.firewall_enabled ?? null,
      pending_updates: payload.security?.pending_updates ?? null,
      ip_publico: ipPublico,
    };

    // insert snapshot
    await supabase.from("endpoint_inventory_snapshots").insert({
      empresa_id: agent.empresa_id,
      agent_id: agent.id,
      payload,
      hash_payload: payloadHash,
    });

    // update agent
    await supabase.from("endpoint_agents").update({
      hostname: payload.hostname,
      so: payload.os ?? null,
      so_versao: payload.os_version ?? null,
      versao_agente: payload.agent_version ?? null,
      mac_addresses: payload.mac_addresses ?? null,
      ip_publico: ipPublico,
      status: "online",
      ultimo_checkin: new Date().toISOString(),
      postura_resumo: posturaResumo,
    }).eq("id", agent.id);

    // update ativo summary
    if (agent.ativo_id) {
      await supabase.from("ativos").update({
        nome: payload.hostname,
        descricao: [payload.hardware?.manufacturer, payload.hardware?.model, payload.os, payload.os_version].filter(Boolean).join(" "),
        fornecedor: payload.hardware?.manufacturer ?? null,
        versao: payload.os_version ?? null,
      }).eq("id", agent.ativo_id);
    }

    return new Response(
      JSON.stringify({ ok: true, next_checkin_seconds: 3600 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("agent-checkin error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
