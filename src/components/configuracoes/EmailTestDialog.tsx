import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogShell } from "@/components/ui/dialog-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";

interface EmailTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailTestDialog({ open, onOpenChange }: EmailTestDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendTest = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Por favor, insira um e-mail válido");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-test-email", {
        body: { email },
      });

      if (error) throw error;

      toast.success("E-mail de teste enviado com sucesso! Verifique sua caixa de entrada.");
      onOpenChange(false);
      setEmail("");
    } catch (error: any) {
      console.error("Erro ao enviar e-mail de teste:", error);
      toast.error(error.message || "Erro ao enviar e-mail de teste");
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-2 w-full">
      <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
        Cancelar
      </Button>
      <Button size="sm" onClick={handleSendTest} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Enviar Teste
          </>
        )}
      </Button>
    </div>
  );

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Enviar E-mail de Teste"
      description="Envie um e-mail de teste para visualizar o novo layout profissional"
      icon={Mail}
      size="sm"
      footer={footer}
      onSubmit={handleSendTest}
      isDirty={!!email}
    >
      <div className="grid gap-2">
        <Label htmlFor="email">E-mail de destino</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendTest()}
        />
      </div>
    </DialogShell>
  );
}
