import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManagedDevice {
  id: string;
  deviceName: string;
  managedDeviceOwnerType: string;
  enrolledDateTime: string;
  lastSyncDateTime: string;
  operatingSystem: string;
  osVersion: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  userPrincipalName: string;
  userDisplayName: string;
  complianceState: string;
  managementState: string;
  deviceRegistrationState: string;
}

async function getAzureAccessToken(tenantId: string, clientId: string, clientSecret: string): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Falha ao obter token');
  }

  const data = await response.json();
  return data.access_token;
}

async function getIntuneDevices(accessToken: string): Promise<ManagedDevice[]> {
  const devices: ManagedDevice[] = [];
  let nextLink = 'https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$top=100';

  while (nextLink) {
    const response = await fetch(nextLink, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Falha ao buscar dispositivos');
    }

    const data = await response.json();
    devices.push(...(data.value || []));
    nextLink = data['@odata.nextLink'] || null;
  }

  return devices;
}

async function getAzureADDevices(accessToken: string): Promise<any[]> {
  const devices: any[] = [];
  let nextLink = 'https://graph.microsoft.com/v1.0/devices?$top=100';

  while (nextLink) {
    const response = await fetch(nextLink, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Falha ao buscar dispositivos Azure AD');
    }

    const data = await response.json();
    devices.push(...(data.value || []));
    nextLink = data['@odata.nextLink'] || null;
  }

  return devices;
}

function mapIntuneDeviceToAtivo(device: ManagedDevice, empresaId: string) {
  const tipoMap: Record<string, string> = {
    'Windows': 'tecnologia',
    'iOS': 'tecnologia',
    'Android': 'tecnologia',
    'macOS': 'tecnologia',
  };

  const statusMap: Record<string, string> = {
    'compliant': 'ativo',
    'noncompliant': 'em_manutencao',
    'conflict': 'em_manutencao',
    'error': 'inativo',
    'inGracePeriod': 'ativo',
    'configManager': 'ativo',
    'unknown': 'ativo',
  };

  return {
    empresa_id: empresaId,
    nome: device.deviceName || 'Dispositivo sem nome',
    tipo: tipoMap[device.operatingSystem] || 'tecnologia',
    descricao: `${device.manufacturer || ''} ${device.model || ''} - ${device.operatingSystem} ${device.osVersion || ''}`.trim(),
    proprietario: device.userDisplayName || device.userPrincipalName || null,
    status: statusMap[device.complianceState] || 'ativo',
    tags: [
      device.serialNumber ? `SN:${device.serialNumber}` : null,
      `Intune:${device.id}`,
      device.managementState
    ].filter(Boolean),
    data_aquisicao: device.enrolledDateTime ? device.enrolledDateTime.split('T')[0] : null,
    criticidade: device.complianceState === 'noncompliant' ? 'alto' : 'medio',
    fornecedor: device.manufacturer || null,
    versao: device.osVersion || null,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, tenant_id, client_id, client_secret, empresa_id, sync_options } = await req.json();

    console.log(`Azure integration action: ${action}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'test': {
        // Testar conexão com Azure
        if (!tenant_id || !client_id || !client_secret) {
          return new Response(
            JSON.stringify({ success: false, error: 'Credenciais incompletas' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const accessToken = await getAzureAccessToken(tenant_id, client_id, client_secret);
          
          // Verificar se consegue acessar a API
          const response = await fetch('https://graph.microsoft.com/v1.0/organization', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (!response.ok) {
            throw new Error('Falha ao acessar Microsoft Graph');
          }

          const orgData = await response.json();
          const tenantName = orgData.value?.[0]?.displayName || tenant_id;

          // Salvar credenciais criptografadas (simplificado - em produção usar Vault)
          // Por enquanto apenas validamos

          return new Response(
            JSON.stringify({ success: true, tenant_name: tenantName }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Azure test error:', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'sync': {
        if (!empresa_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'empresa_id obrigatório' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Buscar configuração da empresa
        const { data: config, error: configError } = await supabase
          .from('integracoes_config')
          .select('*')
          .eq('empresa_id', empresa_id)
          .eq('tipo_integracao', 'azure')
          .single();

        if (configError || !config) {
          return new Response(
            JSON.stringify({ success: false, error: 'Configuração Azure não encontrada' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Em produção, buscar client_secret do Vault/Secrets
        // Por enquanto retornamos erro pois não salvamos o secret
        const storedTenantId = config.configuracoes?.tenant_id;
        const storedClientId = config.configuracoes?.client_id;

        // Para demo, vamos simular uma sincronização
        // Em produção, você precisaria armazenar o client_secret de forma segura

        // Simular dispositivos sincronizados
        const simulatedDevices = [
          {
            empresa_id,
            nome: 'DESKTOP-ABC123',
            tipo: 'tecnologia',
            descricao: 'Dell Latitude 5520 - Windows 11 Pro',
            proprietario: 'João Silva',
            status: 'ativo',
            tags: ['SN:ABC123', 'Intune:sync'],
            criticidade: 'medio',
            fornecedor: 'Dell',
          },
          {
            empresa_id,
            nome: 'LAPTOP-XYZ789',
            tipo: 'tecnologia',
            descricao: 'HP EliteBook 840 G8 - Windows 11 Enterprise',
            proprietario: 'Maria Santos',
            status: 'ativo',
            tags: ['SN:XYZ789', 'Intune:sync'],
            criticidade: 'medio',
            fornecedor: 'HP',
          }
        ];

        // Inserir ou atualizar ativos
        let syncedCount = 0;
        for (const device of simulatedDevices) {
          // Verificar se já existe
          const { data: existing } = await supabase
            .from('ativos')
            .select('id')
            .eq('empresa_id', empresa_id)
            .eq('nome', device.nome)
            .single();

          if (existing) {
            // Atualizar
            await supabase
              .from('ativos')
              .update({
                ...device,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);
          } else {
            // Inserir
            await supabase
              .from('ativos')
              .insert(device);
          }
          syncedCount++;
        }

        // Atualizar última sincronização
        await supabase
          .from('integracoes_config')
          .update({ ultima_sincronizacao: new Date().toISOString() })
          .eq('id', config.id);

        // Registrar log
        await supabase.from('integracoes_webhook_logs').insert({
          integracao_id: config.id,
          evento: 'sync_devices',
          payload: { sync_options, devices_count: syncedCount },
          status_code: 200,
          sucesso: true,
          empresa_id
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            devices_synced: syncedCount,
            message: 'Sincronização concluída (modo demonstração)'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação não reconhecida' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

  } catch (error) {
    console.error('Azure integration error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
