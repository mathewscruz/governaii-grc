import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Não autenticado')

    const { data: caller } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (caller?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Apenas super_admin pode excluir empresas' }), {
        status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { empresa_id, confirm_name } = await req.json()
    if (!empresa_id) throw new Error('empresa_id obrigatório')

    const { data: empresa, error: empresaErr } = await supabaseAdmin
      .from('empresas')
      .select('id, nome, logo_url')
      .eq('id', empresa_id)
      .maybeSingle()

    if (empresaErr || !empresa) throw new Error('Empresa não encontrada')

    if (confirm_name && confirm_name.trim() !== empresa.nome.trim()) {
      return new Response(JSON.stringify({ error: 'Nome de confirmação não confere' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Buscar usuários da empresa
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('empresa_id', empresa_id)

    const userIds = (profiles || []).map(p => p.user_id).filter(Boolean) as string[]

    // Remover logo do storage
    if (empresa.logo_url) {
      try {
        const fileName = empresa.logo_url.split('/').pop()
        if (fileName) await supabaseAdmin.storage.from('empresa-logos').remove([fileName])
      } catch (e) {
        console.warn('Falha ao remover logo:', e)
      }
    }

    // Deletar empresa (CASCADE deve cuidar de FKs com ON DELETE CASCADE)
    const { error: delErr } = await supabaseAdmin
      .from('empresas')
      .delete()
      .eq('id', empresa_id)

    if (delErr) {
      return new Response(JSON.stringify({
        error: 'DELETE_FAILED',
        message: `Não foi possível excluir: ${delErr.message}. Verifique se há dados vinculados.`,
      }), { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // Remover usuários do auth (após delete da empresa)
    let deletedUsers = 0
    for (const uid of userIds) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(uid)
        deletedUsers++
      } catch (e) {
        console.warn('Falha ao deletar auth user', uid, e)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      empresa_id,
      deleted_users: deletedUsers,
    }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (error: any) {
    console.error('[delete-empresa-safe]', error)
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
