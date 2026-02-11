import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ArrowLeft, Building2, Mail, Lock, User } from 'lucide-react';
import logoImage from '@/assets/akuris-logo.png';
import { STRIPE_PLANS, type PlanKey } from '@/lib/stripe-plans';
import { z } from 'zod';

const registroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  empresa: z.string().min(2, 'Nome da empresa é obrigatório'),
  cnpj: z.string().optional(),
});

const Registro = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planoParam = (searchParams.get('plano') || 'starter') as PlanKey;
  const billingParam = searchParams.get('billing') || 'monthly';
  const selectedPlan = STRIPE_PLANS[planoParam] || STRIPE_PLANS.starter;

  const [form, setForm] = useState({ nome: '', email: '', senha: '', empresa: '', cnpj: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = registroSchema.safeParse(form);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('provision-new-account', {
        body: {
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          empresa_nome: form.empresa,
          cnpj: form.cnpj || null,
          plano_codigo: planoParam,
          billing: billingParam,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.checkout_url) {
        // Sign in the user first
        await supabase.auth.signInWithPassword({ email: form.email, password: form.senha });
        window.location.href = data.checkout_url;
      } else {
        toast.success('Conta criada com sucesso!');
        await supabase.auth.signInWithPassword({ email: form.email, password: form.senha });
        navigate('/dashboard');
      }
    } catch (error: any) {
      const msg = error?.message || 'Erro ao criar conta';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        toast.error('Este email já está cadastrado. Faça login.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(216,60%,8%)] via-[hsl(216,45%,12%)] to-[hsl(216,60%,8%)] px-4 py-8 relative overflow-hidden">
      <div className="landing-grid-bg absolute inset-0 opacity-30" />
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center">
          <img src={logoImage} alt="Akuris" className="h-14 mx-auto object-contain mb-4" />
          <h1 className="text-2xl font-bold text-white">Criar sua conta</h1>
          <p className="text-white/50 text-sm mt-1">
            Plano selecionado: <span className="text-primary font-medium">{selectedPlan.name}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-8 shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-white/70 text-sm">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  id="nome" name="nome" value={form.nome} onChange={handleChange}
                  placeholder="Seu nome completo"
                  className={`h-11 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary ${errors.nome ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/70 text-sm">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  id="email" name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="email@empresa.com.br"
                  className={`h-11 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary ${errors.email ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha" className="text-white/70 text-sm">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  id="senha" name="senha" type={showPassword ? 'text' : 'password'} value={form.senha} onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className={`h-11 pl-10 pr-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary ${errors.senha ? 'border-destructive' : ''}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.senha && <p className="text-xs text-destructive">{errors.senha}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="empresa" className="text-white/70 text-sm">Nome da empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  id="empresa" name="empresa" value={form.empresa} onChange={handleChange}
                  placeholder="Nome da sua empresa"
                  className={`h-11 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary ${errors.empresa ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.empresa && <p className="text-xs text-destructive">{errors.empresa}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cnpj" className="text-white/70 text-sm">CNPJ <span className="text-white/30">(opcional)</span></Label>
              <Input
                id="cnpj" name="cnpj" value={form.cnpj} onChange={handleChange}
                placeholder="00.000.000/0000-00"
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary"
              />
            </div>

            <Button type="submit" variant="gradient" className="w-full h-11 font-semibold text-sm mt-2" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando conta...</> : 'Criar conta e assinar'}
            </Button>
          </form>
        </div>

        <div className="text-center space-y-2">
          <p className="text-white/40 text-sm">
            Já tem uma conta?{' '}
            <Link to="/auth" className="text-primary hover:text-primary/80 hover:underline">Fazer login</Link>
          </p>
          <Link to="/" className="inline-flex items-center gap-1 text-white/30 hover:text-white/50 text-xs">
            <ArrowLeft className="w-3 h-3" /> Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Registro;
