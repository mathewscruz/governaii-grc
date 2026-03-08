

# Auto-detecção de idioma por localidade

## Abordagem

Usar `navigator.language` do browser para detectar o idioma do visitante. Se não começar com `pt`, carrega em inglês automaticamente. Só aplica na primeira visita (se não houver preferência salva no localStorage).

## Implementação

**Arquivo:** `src/contexts/LanguageContext.tsx`

Alterar a lógica de inicialização do estado `locale`:

```typescript
const [locale, setLocaleState] = useState<Locale>(() => {
  const saved = localStorage.getItem('governaii-locale');
  if (saved === 'en' || saved === 'pt') return saved;
  // Auto-detect: se o browser não é pt, usa inglês
  const browserLang = navigator.language || '';
  return browserLang.startsWith('pt') ? 'pt' : 'en';
});
```

Apenas essa mudança. Quando o usuário trocar manualmente via seletor, o localStorage salva a preferência e prevalece nas próximas visitas.

