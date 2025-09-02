import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const contactData: ContactFormData = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Save to database
    const { error: dbError } = await supabase
      .from("contact_form_submissions")
      .insert({
        name: contactData.name,
        email: contactData.email,
        company: contactData.company,
        phone: contactData.phone,
        message: contactData.message,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save contact form data");
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "GovernAII <noreply@governaii.com>",
      to: ["henrique.mathews@gmail.com"],
      subject: `Novo contato pelo site - ${contactData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
            Novo Contato - GovernAII
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Nome:</strong> ${contactData.name}</p>
            <p><strong>E-mail:</strong> ${contactData.email}</p>
            ${contactData.company ? `<p><strong>Empresa:</strong> ${contactData.company}</p>` : ''}
            ${contactData.phone ? `<p><strong>Telefone:</strong> ${contactData.phone}</p>` : ''}
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #1f2937;">Mensagem:</h3>
            <div style="background-color: #ffffff; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0;">
              ${contactData.message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Este e-mail foi enviado automaticamente pelo formulário de contato do site GovernAII.
          </p>
        </div>
      `,
    });

    console.log("Contact email sent successfully:", emailResponse);

    // Update database to mark as processed
    await supabase
      .from("contact_form_submissions")
      .update({ 
        status: "processed", 
        processed_at: new Date().toISOString() 
      })
      .eq("email", contactData.email)
      .eq("name", contactData.name)
      .order("created_at", { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Mensagem enviada com sucesso!" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Erro interno do servidor" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);