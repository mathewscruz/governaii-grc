
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  nome: string
  email: string
  role: 'super_admin' | 'admin' | 'user' | 'readonly'
  empresa_id?: string
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
    console.log('Recebendo requisição para criar usuário')

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

    // Buscar perfil do usuário atual
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, empresa_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !currentUserProfile) {
      throw new Error('Perfil do usuário não encontrado')
    }

    const { nome, email, role, empresa_id }: CreateUserRequest = await req.json()

    // Validar permissões
    const isSuperAdmin = currentUserProfile.role === 'super_admin'
    const isAdmin = currentUserProfile.role === 'admin'

    if (!isSuperAdmin && !isAdmin) {
      throw new Error('Usuário não tem permissão para criar outros usuários')
    }

    // Se não for super admin, não pode criar super admins
    if (!isSuperAdmin && role === 'super_admin') {
      throw new Error('Apenas super admins podem criar outros super admins')
    }

    // Para admins, forçar empresa_id para ser a mesma do usuário atual
    let finalEmpresaId = empresa_id
    if (!isSuperAdmin) {
      finalEmpresaId = currentUserProfile.empresa_id
    } else if (!empresa_id) {
      // Se super admin não especificou empresa, usar a própria
      finalEmpresaId = currentUserProfile.empresa_id
    }

    console.log(`Criando usuário: ${email}`)

    // Verificar se já existe usuário com este email no Auth
    const { data: existingAuthUsers, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listUsersError) {
      console.error('Erro ao verificar usuários existentes:', listUsersError)
      throw new Error('Erro ao verificar usuários existentes')
    }

    const existingAuthUser = existingAuthUsers.users.find(user => user.email === email)

    let authData: any

    if (existingAuthUser) {
      console.log('Usuário já existe no Auth:', existingAuthUser.id)
      
      // Verificar se tem profile
      const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', existingAuthUser.id)
        .single()
      
      if (profileCheckError && profileCheckError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Erro ao verificar profile existente:', profileCheckError)
        throw new Error('Erro ao verificar dados do usuário')
      }

      if (existingProfile) {
        // Usuário já existe completamente
        return new Response(JSON.stringify({
          error: 'DUPLICATE_USER',
          message: 'Usuário já existe no sistema',
          details: {
            user_id: existingAuthUser.id,
            profile_id: existingProfile.id,
            email: email,
            nome: existingProfile.nome,
            created_at: existingProfile.created_at
          },
          suggestions: [
            'Verifique se o email está correto',
            'Use a opção "Reenviar Email de Boas-vindas" se necessário',
            'Edite o usuário existente se precisar fazer alterações'
          ]
        }), {
          status: 409, // Conflict
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        })
      } else {
        // Usuário órfão - existe no Auth mas não tem profile
        console.log('Usuário órfão detectado - recriando profile para:', email)
        authData = { user: existingAuthUser }
      }
    } else {
      // Criar novo usuário no Auth
      const { data: newAuthData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'temp123456', // Senha temporária inicial
        email_confirm: true,
        user_metadata: {
          nome: nome,
          admin_created: 'true'
        }
      })

      if (createUserError || !newAuthData.user) {
        console.error('Erro ao criar usuário no Auth:', createUserError)
        throw new Error(createUserError?.message || 'Erro ao criar usuário')
      }

      authData = newAuthData
    }

    console.log('Processando usuário no Auth:', authData.user.id)

    // Aguardar um pouco para garantir que o usuário foi criado
    await new Promise(resolve => setTimeout(resolve, 100))

    // Criar perfil do usuário (o trigger não criará automaticamente devido ao admin_created)
    const { error: profileInsertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        nome: nome,
        email: email,
        role: role,
        empresa_id: finalEmpresaId,
      })

    if (profileInsertError) {
      console.error('Erro ao criar perfil:', profileInsertError)
      // Se falhar ao criar perfil e o usuário foi criado agora, remover do Auth
      if (!existingAuthUser) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      }
      throw new Error('Erro ao criar perfil do usuário')
    }

    console.log('Perfil criado com sucesso')

    // Gerar senha temporária
    const { data: tempPassword, error: passwordError } = await supabaseAdmin
      .rpc('generate_temp_password')

    if (passwordError || !tempPassword) {
      console.error('Erro ao gerar senha temporária:', passwordError)
      throw new Error('Erro ao gerar senha temporária')
    }

    // Atualizar com a senha temporária gerada
    const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(
      authData.user.id,
      { password: tempPassword }
    )

    if (updatePasswordError) {
      console.error('Erro ao atualizar senha:', updatePasswordError)
      throw new Error('Erro ao definir senha temporária')
    }

    // Registrar senha temporária
    await supabaseAdmin
      .from('temporary_passwords')
      .insert({
        user_id: authData.user.id,
        is_temporary: true,
      })

    console.log('Senha temporária registrada')

    // Aplicar permissões padrão para o novo usuário
    try {
      console.log('Aplicando permissões padrão para o usuário...')
      const { error: permissionsError } = await supabaseAdmin
        .rpc('apply_default_permissions_for_user', { 
          user_id_param: authData.user.id 
        })

      if (permissionsError) {
        console.error('Erro ao aplicar permissões padrão:', permissionsError)
        // Não falhar a criação do usuário por causa das permissões
      } else {
        console.log('Permissões padrão aplicadas com sucesso')
      }
    } catch (permError) {
      console.error('Exceção ao aplicar permissões:', permError)
      // Não falhar a criação do usuário por causa das permissões
    }

    // Enviar e-mail de boas-vindas
    let emailSent = false;
    try {
      console.log('Tentando enviar e-mail de boas-vindas...')
      const { data: emailData, error: emailError } = await supabaseAdmin.functions.invoke('send-welcome-email', {
        body: {
          userName: nome,
          userEmail: email,
          temporaryPassword: tempPassword,
        }
      })

      if (emailError) {
        console.error('Erro ao enviar e-mail:', emailError)
        console.error('Detalhes do erro:', JSON.stringify(emailError, null, 2))
      } else {
        console.log('E-mail de boas-vindas enviado com sucesso:', emailData)
        emailSent = true;
      }
    } catch (emailError) {
      console.error('Exceção ao enviar e-mail:', emailError)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: {
        id: authData.user.id,
        email: email,
        nome: nome
      },
      emailSent: emailSent,
      message: emailSent ? 'Usuário criado com sucesso! E-mail de boas-vindas enviado.' : 'Usuário criado com sucesso! Falha no envio do e-mail.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })

  } catch (error: any) {
    console.error('Erro na função create-user:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Falha ao criar usuário'
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
