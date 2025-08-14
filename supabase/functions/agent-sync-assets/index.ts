import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { agent_token, hostname, assets } = await req.json();

    if (!agent_token || !assets) {
      throw new Error('Agent token and assets data are required');
    }

    console.log(`Syncing assets from agent: ${agent_token}, hostname: ${hostname}`);

    // Buscar agente
    const { data: agent, error: agentError } = await supabaseClient
      .from('asset_agents')
      .select('*')
      .eq('agent_token', agent_token)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      throw new Error('Agent not found');
    }

    // Processar descoberta de ativos
    const discoveredAssets = await processDiscoveredAssets(assets, agent);

    // Inserir/atualizar ativos na tabela principal
    const results = [];
    for (const asset of discoveredAssets) {
      try {
        // Verificar se já existe um ativo com as mesmas características
        const { data: existingAssets, error: searchError } = await supabaseClient
          .from('ativos')
          .select('*')
          .eq('empresa_id', agent.empresa_id)
          .eq('agent_id', agent.id)
          .eq('nome', asset.nome);

        if (searchError) {
          console.error('Error searching existing assets:', searchError);
          continue;
        }

        if (existingAssets && existingAssets.length > 0) {
          // Atualizar ativo existente
          const { data: updatedAsset, error: updateError } = await supabaseClient
            .from('ativos')
            .update({
              ...asset,
              last_sync: new Date().toISOString(),
              agent_status: 'online',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAssets[0].id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating asset:', updateError);
          } else {
            results.push({ action: 'updated', asset: updatedAsset });
          }
        } else {
          // Criar novo ativo
          const { data: newAsset, error: insertError } = await supabaseClient
            .from('ativos')
            .insert({
              ...asset,
              empresa_id: agent.empresa_id,
              agent_id: agent.id,
              origem: 'agente',
              agent_status: 'online',
              last_sync: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error inserting asset:', insertError);
          } else {
            results.push({ action: 'created', asset: newAsset });
          }
        }
      } catch (error) {
        console.error('Error processing asset:', error);
      }
    }

    console.log(`Asset sync completed for agent ${agent_token}. Processed ${results.length} assets.`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Assets synced successfully',
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error syncing assets:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function processDiscoveredAssets(assets: any, agent: any): any[] {
  const discoveredAssets = [];

  try {
    // Ativo principal (o computador/servidor)
    const mainAsset = {
      nome: agent.hostname || 'Computador Descoberto',
      tipo: 'Computador',
      descricao: `Ativo descoberto automaticamente pelo agente`,
      hostname: agent.hostname,
      ip_address: agent.ip_address,
      sistema_operacional: agent.operating_system,
      versao_so: agent.os_version,
      status: 'ativo',
      criticidade: 'medio',
      valor_negocio: 'medio',
      localizacao: 'Descoberto pelo Agente',
      tags: ['descoberto-automaticamente', 'agente']
    };

    discoveredAssets.push(mainAsset);

    // Processar software instalado (se disponível)
    if (assets.installed_software) {
      let softwareList = [];
      
      if (typeof assets.installed_software === 'string') {
        // Para sistemas Linux/macOS com lista textual
        softwareList = assets.installed_software.split('\n')
          .filter(line => line.trim())
          .slice(0, 50); // Limitar para evitar sobrecarga
      } else if (Array.isArray(assets.installed_software)) {
        // Para sistemas Windows com array de objetos
        softwareList = assets.installed_software.slice(0, 50);
      }

      for (const software of softwareList) {
        try {
          let softwareName = '';
          let softwareVersion = '';

          if (typeof software === 'string') {
            softwareName = software.split(' ')[0];
            softwareVersion = 'Desconhecida';
          } else if (software.Name) {
            softwareName = software.Name;
            softwareVersion = software.Version || 'Desconhecida';
          }

          if (softwareName && softwareName.length > 3) { // Filtrar nomes muito curtos
            discoveredAssets.push({
              nome: softwareName,
              tipo: 'Software',
              descricao: `Software descoberto automaticamente`,
              versao: softwareVersion,
              hostname: agent.hostname,
              sistema_operacional: agent.operating_system,
              status: 'ativo',
              criticidade: 'baixo',
              valor_negocio: 'baixo',
              localizacao: 'Descoberto pelo Agente',
              tags: ['software', 'descoberto-automaticamente']
            });
          }
        } catch (error) {
          console.error('Error processing software item:', error);
        }
      }
    }

    // Processar aplicações macOS (se disponível)
    if (assets.installed_applications && Array.isArray(assets.installed_applications)) {
      for (const app of assets.installed_applications.slice(0, 30)) {
        if (app && app.endsWith('.app')) {
          const appName = app.replace('.app', '');
          discoveredAssets.push({
            nome: appName,
            tipo: 'Aplicação',
            descricao: `Aplicação macOS descoberta automaticamente`,
            hostname: agent.hostname,
            sistema_operacional: 'macOS',
            status: 'ativo',
            criticidade: 'baixo',
            valor_negocio: 'baixo',
            localizacao: 'Descoberto pelo Agente',
            tags: ['aplicacao', 'macos', 'descoberto-automaticamente']
          });
        }
      }
    }

  } catch (error) {
    console.error('Error processing discovered assets:', error);
  }

  return discoveredAssets;
}