import { PageHeader } from "@/components/ui/page-header";
import SistemasContent from "@/components/governanca/SistemasContent";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Sistemas() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('modules.sistemas.title')}
        description={t('modules.sistemas.description')}
      />
      <SistemasContent />
    </div>
  );
}
