import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_MAP: Record<string, { plano_id: string; stripe_price_monthly: string; stripe_price_annual?: string }> = {
  starter: {
    plano_id: "45d5976f-bc3a-4f0d-ad7c-d6e83e07daf2",
    stripe_price_monthly: "price_1SzeYEHrs8FLfXKfTvHzWVhP",
  },
  professional: {
    plano_id: "01d16b42-28f5-4246-890e-01ac6abc50dd",
    stripe_price_monthly: "price_1SzeYcHrs8FLfXKfOam3UREW",
  },
  enterprise: {
    plano_id: "8c3b8dd5-fae7-425a-91b8-4917e22fa691",
    stripe_price_monthly: "price_1SzeYwHrs8FLfXKfeJ9QjnBD",
  },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PROVISION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { nome, email, senha, empresa_nome, cnpj, plano_codigo, billing } = await req.json();
    const isFree = plano_codigo === "free";
    logStep("Request received", { email, empresa_nome, plano_codigo, billing, isFree });

    if (!nome || !email || !senha || !empresa_nome) {
      throw new Error("Campos obrigatórios: nome, email, senha, empresa_nome");
    }

    const planConfig = PLAN_MAP[isFree ? "starter" : plano_codigo] || PLAN_MAP.starter;
    const priceId = billing === "annual" && planConfig.stripe_price_annual
      ? planConfig.stripe_price_annual
      : planConfig.stripe_price_monthly;

    // 1. Create user in Supabase Auth
    logStep("Creating auth user");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, empresa_nome },
    });

    if (authError) {
      logStep("Auth error", { message: authError.message });
      throw new Error(authError.message);
    }

    const userId = authData.user.id;
    logStep("User created", { userId });

    // 2. Generate slug from empresa_nome
    const slug = empresa_nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // 3. Create empresa
    logStep("Creating empresa");
    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from("empresas")
      .insert({
        nome: empresa_nome,
        cnpj: cnpj || null,
        slug,
        status_licenca: "trial",
        data_inicio_trial: new Date().toISOString(),
        plano_id: planConfig.plano_id,
      })
      .select("id")
      .single();

    if (empresaError) {
      logStep("Empresa error", { message: empresaError.message });
      // Cleanup: delete user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Erro ao criar empresa: " + empresaError.message);
    }

    logStep("Empresa created", { empresaId: empresa.id });

    // 4. Create profile
    logStep("Creating profile");
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      user_id: userId,
      empresa_id: empresa.id,
      nome,
      email,
      role: "admin",
      ativo: true,
    });

    if (profileError) {
      logStep("Profile error", { message: profileError.message });
      await supabaseAdmin.from("empresas").delete().eq("id", empresa.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Erro ao criar perfil: " + profileError.message);
    }

    logStep("Profile created");

    // 5. Apply default permissions
    logStep("Applying default permissions");
    try {
      const modules = [
        "dashboard", "riscos", "gap-analysis", "controles", "auditorias",
        "documentos", "incidentes", "dados", "ativos", "contratos",
        "contas-privilegiadas", "due-diligence", "denuncia", "configuracoes",
        "planos-acao", "relatorios", "politicas",
      ];

      const permissions = modules.map((mod) => ({
        user_id: userId,
        empresa_id: empresa.id,
        module_name: mod,
        can_access: true,
        can_create: true,
        can_read: true,
        can_edit: true,
        can_delete: true,
      }));

      await supabaseAdmin.from("user_permissions").insert(permissions);
      logStep("Permissions applied");
    } catch (permError) {
      logStep("Permissions warning (non-fatal)", { message: String(permError) });
    }

    // 6. For free plan, skip Stripe checkout entirely
    if (isFree) {
      logStep("Free plan - skipping Stripe checkout");
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Create Stripe Checkout session with trial for paid plans
    logStep("Creating Stripe checkout");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("No Stripe key, skipping checkout");
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 14,
      },
      success_url: `${req.headers.get("origin")}/checkout-success`,
      cancel_url: `${req.headers.get("origin")}/registro?plano=${plano_codigo}`,
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ success: true, checkout_url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
