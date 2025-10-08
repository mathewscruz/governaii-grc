import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar E-mail de Teste
          </DialogTitle>
          <DialogDescription>
            Envie um e-mail de teste para visualizar o novo layout profissional
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSendTest} disabled={loading}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}