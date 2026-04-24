import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUserRequest {
  user_id: string
  profile_id: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    console.log('Iniciando exclusão completa de usuário')

    // Criar cliente Supabase com service role para operações administrativas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Criar cliente normal para verificações de RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? '',
          },
        },
      }
    )

    // Verificar autenticação do usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Usuário não autenticado')
    }

    // Buscar perfil do usuário atual para verificar permissões
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, empresa_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !currentUserProfile) {
      throw new Error('Perfil do usuário não encontrado')
    }

    const { user_id, profile_id }: DeleteUserRequest = await req.json()

    console.log(`Excluindo usuário: ${user_id}`)

    // Verificar se o usuário alvo existe
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('role, empresa_id, nome, email')
      .eq('user_id', user_id)
      .single()

    if (targetError) {
      console.log('Profile não encontrado, apenas removendo do Auth se necessário')
    }

    // Validar permissões
    const isSuperAdmin = currentUserProfile.role === 'super_admin'
    const isAdmin = currentUserProfile.role === 'admin'

    if (!isSuperAdmin && !isAdmin) {
      throw new Error('Usuário não tem permissão para excluir outros usuários')
    }

    // Se não for super admin, verificar restrições adicionais
    if (!isSuperAdmin && targetProfile) {
      if (targetProfile.empresa_id !== currentUserProfile.empresa_id) {
        throw new Error('Você só pode excluir usuários da sua empresa')
      }
      if (['admin', 'super_admin'].includes(targetProfile.role)) {
        throw new Error('Você não pode excluir outros administradores')
      }
    }

    let deletedProfile = false
    let deletedAuth = false

    // 1. Tentar excluir o profile primeiro
    if (targetProfile) {
      console.log('Excluindo profile...')
      const { error: profileDeleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('user_id', user_id)

      if (profileDeleteError) {
        console.error('Erro ao excluir profile:', profileDeleteError)
        throw new Error('Erro ao excluir perfil do usuário')
      }
      deletedProfile = true
      console.log('Profile excluído com sucesso')
    }

    // 2. Tentar excluir do Auth
    console.log('Excluindo usuário do Auth...')
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (authDeleteError) {
      console.error('Erro ao excluir usuário do Auth:', authDeleteError)
      // Se profile foi excluído mas Auth falhou, ainda é um sucesso parcial
      if (deletedProfile) {
        console.log('Profile excluído, mas falha na exclusão do Auth')
      } else {
        throw new Error('Erro ao excluir usuário do sistema de autenticação')
      }
    } else {
      deletedAuth = true
      console.log('Usuário excluído do Auth com sucesso')
    }

    const resultMessage = deletedProfile && deletedAuth 
      ? 'Usuário excluído completamente do sistema'
      : deletedProfile 
        ? 'Profile excluído, mas usuário pode ainda existir no Auth'
        : 'Usuário removido do Auth'

    return new Response(JSON.stringify({ 
      success: true,
      message: resultMessage,
      details: {
        profile_deleted: deletedProfile,
        auth_deleted: deletedAuth,
        user_id: user_id
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })

  } catch (error: any) {
    console.error('Erro na função delete-user-complete:', error)
    return new Response(
      JSON.stringify({
        error: (error instanceof Error ? error.message : String(error)),
        details: 'Falha na exclusão completa do usuário'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    )
  }
})