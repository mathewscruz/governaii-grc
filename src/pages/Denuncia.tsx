import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DenunciasDashboard } from '@/components/denuncia/DenunciasDashboard';
import { ConfiguracoesDenuncia } from '@/components/denuncia/ConfiguracoesDenuncia';
import { CategoriasDenuncia } from '@/components/denuncia/CategoriasDenuncia';
import { RelatoriosDenuncia } from '@/components/denuncia/RelatoriosDenuncia';

export default function Denuncia() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canal de Denúncia</h1>
          <p className="text-muted-foreground">
            Gerencie denúncias e mantenha um ambiente ético e transparente
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DenunciasDashboard />
        </TabsContent>

        <TabsContent value="configuracoes">
          <ConfiguracoesDenuncia />
        </TabsContent>

        <TabsContent value="categorias">
          <CategoriasDenuncia />
        </TabsContent>

        <TabsContent value="relatorios">
          <RelatoriosDenuncia />
        </TabsContent>
      </Tabs>
    </div>
  );
}