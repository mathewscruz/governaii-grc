import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Bell, Mail, Clock, Users, TrendingUp } from "lucide-react"

interface ReminderSettings {
  id?: string
  empresa_id: string
  reminders_enabled: boolean
  reminder_intervals: number[]
  max_reminders: number
}

interface ReminderStats {
  total_invited: number
  pending_reminders: number
  completed_invitations: number
  reminder_effectiveness: number
}

export function ReminderSettings() {
  const [settings, setSettings] = useState<ReminderSettings>({
    empresa_id: '',
    reminders_enabled: true,
    reminder_intervals: [3, 7, 14],
    max_reminders: 3
  })
  const [stats, setStats] = useState<ReminderStats>({
    total_invited: 0,
    pending_reminders: 0,
    completed_invitations: 0,
    reminder_effectiveness: 0
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
    loadStats()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('empresa_reminder_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error)
        return
      }

      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Contar usuários convidados (com senha temporária)
      const { count: totalInvited } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('temporary_passwords', 'is', null)

      // Contar lembretes pendentes (ativos)
      const { count: pendingReminders } = await supabase
        .from('user_invitation_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Contar convites completados (usuários que fizeram login)
      const { count: completedInvitations } = await supabase
        .from('user_invitation_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      const effectiveness = totalInvited > 0 
        ? Math.round(((completedInvitations || 0) / totalInvited) * 100)
        : 0

      setStats({
        total_invited: totalInvited || 0,
        pending_reminders: pendingReminders || 0,
        completed_invitations: completedInvitations || 0,
        reminder_effectiveness: effectiveness
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('empresa_reminder_settings')
        .upsert(settings)

      if (error) throw error

      toast({
        title: "Configurações salvas",
        description: "As configurações de lembretes foram atualizadas com sucesso.",
      })
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const processReminders = async () => {
    setProcessing(true)
    try {
      const { data, error } = await supabase.functions.invoke('process-invitation-reminders', {
        body: {}
      })

      if (error) throw error

      toast({
        title: "Lembretes processados",
        description: `${data.sent} lembretes enviados com sucesso.`,
      })

      // Recarregar estatísticas
      loadStats()
    } catch (error: any) {
      console.error('Erro ao processar lembretes:', error)
      toast({
        title: "Erro ao processar lembretes",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const updateInterval = (index: number, value: string) => {
    const newIntervals = [...settings.reminder_intervals]
    newIntervals[index] = parseInt(value) || 0
    setSettings({ ...settings, reminder_intervals: newIntervals })
  }

  if (loading) {
    return <div className="p-6">Carregando configurações...</div>
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">Usuários Convidados</p>
              <p className="text-2xl font-bold">{stats.total_invited}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <Clock className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">Lembretes Pendentes</p>
              <p className="text-2xl font-bold">{stats.pending_reminders}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <Mail className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">Convites Aceitos</p>
              <p className="text-2xl font-bold">{stats.completed_invitations}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold">{stats.reminder_effectiveness}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Lembretes
          </CardTitle>
          <CardDescription>
            Configure como e quando enviar lembretes para usuários convidados que ainda não acessaram a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ativar/Desativar lembretes */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Lembretes Automáticos</Label>
              <p className="text-sm text-muted-foreground">
                Enviar lembretes automáticos para usuários que não fizeram login
              </p>
            </div>
            <Switch
              checked={settings.reminders_enabled}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, reminders_enabled: checked })
              }
            />
          </div>

          {/* Intervalos de lembrete */}
          <div className="space-y-3">
            <Label className="text-base">Intervalos de Lembrete (em dias)</Label>
            <p className="text-sm text-muted-foreground">
              Defina após quantos dias enviar cada lembrete
            </p>
            <div className="grid grid-cols-3 gap-4">
              {settings.reminder_intervals.map((interval, index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-sm">
                    {index === 0 ? '1º Lembrete' : 
                     index === 1 ? '2º Lembrete' : 
                     '3º Lembrete'}
                  </Label>
                  <Input
                    type="number"
                    value={interval}
                    onChange={(e) => updateInterval(index, e.target.value)}
                    min="1"
                    max="30"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Número máximo de lembretes */}
          <div className="space-y-2">
            <Label className="text-base">Número Máximo de Lembretes</Label>
            <p className="text-sm text-muted-foreground">
              Quantos lembretes enviar antes de parar automaticamente
            </p>
            <Input
              type="number"
              value={settings.max_reminders}
              onChange={(e) => setSettings({ 
                ...settings, 
                max_reminders: parseInt(e.target.value) || 3 
              })}
              min="1"
              max="10"
              className="w-24"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button 
              onClick={saveSettings} 
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={processReminders}
              disabled={processing || !settings.reminders_enabled}
            >
              {processing ? "Processando..." : "Processar Lembretes Agora"}
            </Button>
          </div>

          {/* Informações sobre funcionamento */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Como funciona:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Lembretes são enviados apenas para usuários com senhas temporárias ativas</li>
              <li>• O sistema para automaticamente após o número máximo de lembretes</li>
              <li>• Quando o usuário faz login, os lembretes param automaticamente</li>
              <li>• Os intervalos são calculados a partir da data do último lembrete</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}