import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';

const TrialBanner: React.FC = () => {
  const { company } = useAuth();

  if (!company || company.status_licenca !== 'trial' || !company.data_inicio_trial) {
    return null;
  }

  const dataInicio = new Date(company.data_inicio_trial);
  const hoje = new Date();
  const diasDecorridos = differenceInDays(hoje, dataInicio);
  const diasRestantes = Math.max(0, 14 - diasDecorridos);

  if (diasRestantes === 0) {
    return null;
  }

  const corAlerta = diasRestantes <= 3 ? 'bg-destructive/10 border-destructive text-destructive' : 'bg-warning/10 border-warning text-warning';

  return (
    <div className={`border-b ${corAlerta} px-4 py-2`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <p className="text-sm font-medium">
          {diasRestantes === 1 
            ? 'Licença Trial - Resta 1 dia de teste.'
            : `Licença Trial - Restam ${diasRestantes} dias de teste.`
          }
        </p>
        <Link to="/planos" className="text-sm font-semibold underline hover:no-underline ml-1">
          Ver planos
        </Link>
      </div>
    </div>
  );
};

export default TrialBanner;
