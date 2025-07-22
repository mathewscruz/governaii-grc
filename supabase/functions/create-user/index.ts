
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

    // Se não for super admin, só pode criar usuários da própria empresa
    if (!isSuperAdmin && empresa_id !== currentUserProfile.empresa_id) {
      throw new Error('Administradores só podem criar usuários da própria empresa')
    }

    // Se não for super admin, não pode criar super admins
    if (!isSuperAdmin && role === 'super_admin') {
      throw new Error('Apenas super admins podem criar outros super admins')
    }

    console.log(`Criando usuário: ${email}`)

    // Criar usuário no Auth usando service role com metadata admin_created
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: 'temp123456', // Senha temporária inicial
      email_confirm: true,
      user_metadata: {
        nome: nome,
        admin_created: 'true'
      }
    })

    if (createUserError || !authData.user) {
      console.error('Erro ao criar usuário no Auth:', createUserError)
      throw new Error(createUserError?.message || 'Erro ao criar usuário')
    }

    console.log('Usuário criado no Auth:', authData.user.id)

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
        empresa_id: empresa_id || currentUserProfile.empresa_id,
      })

    if (profileInsertError) {
      console.error('Erro ao criar perfil:', profileInsertError)
      // Se falhar ao criar perfil, remover usuário do Auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
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

    // Enviar e-mail de boas-vindas
    try {
      const { error: emailError } = await supabaseAdmin.functions.invoke('send-welcome-email', {
        body: {
          userName: nome,
          userEmail: email,
          temporaryPassword: tempPassword,
        }
      })

      if (emailError) {
        console.error('Erro ao enviar e-mail:', emailError)
        // Não falhar a criação do usuário por causa do e-mail
      } else {
        console.log('E-mail de boas-vindas enviado')
      }
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError)
      // Não falhar a criação do usuário por causa do e-mail
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: {
        id: authData.user.id,
        email: email,
        nome: nome
      }
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
