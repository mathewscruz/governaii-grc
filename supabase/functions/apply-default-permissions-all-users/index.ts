import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar se o usuário atual é admin ou super_admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar role do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting to apply default permissions to all users...')

    // Buscar todos os usuários ativos
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, nome, email, role')
      .eq('ativo', true)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw usersError
    }

    console.log(`Found ${users?.length || 0} active users`)

    // Aplicar permissões padrão para cada usuário
    const results = []
    for (const userProfile of users || []) {
      try {
        console.log(`Applying permissions for user: ${userProfile.email} (${userProfile.role})`)
        
        const { error: permissionError } = await supabase
          .rpc('apply_default_permissions_for_user', { 
            user_id_param: userProfile.user_id 
          })

        if (permissionError) {
          console.error(`Error applying permissions for ${userProfile.email}:`, permissionError)
          results.push({
            user_id: userProfile.user_id,
            email: userProfile.email,
            success: false,
            error: permissionError.message
          })
        } else {
          console.log(`Successfully applied permissions for ${userProfile.email}`)
          results.push({
            user_id: userProfile.user_id,
            email: userProfile.email,
            success: true
          })
        }
      } catch (error) {
        console.error(`Unexpected error for ${userProfile.email}:`, error)
        results.push({
          user_id: userProfile.user_id,
          email: userProfile.email,
          success: false,
          error: (error instanceof Error ? error.message : String(error))
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`Completed: ${successCount} successful, ${failureCount} failed`)

    return new Response(
      JSON.stringify({
        message: 'Default permissions application completed',
        total_users: users?.length || 0,
        successful: successCount,
        failed: failureCount,
        results: results
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in apply-default-permissions-all-users:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: (error instanceof Error ? error.message : String(error)) 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})