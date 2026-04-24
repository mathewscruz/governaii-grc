import { 
  Shield, Lock, LockKeyhole, Leaf, AlertTriangle, Scale, Award, 
  Server, Flag, CreditCard, ShieldCheck, Building, Network, 
  Settings, Target, Crosshair, Layers, Heart, FileCheck, Globe,
  Factory, Landmark, Cog
} from "lucide-react";

interface FrameworkLogoProps {
  nome: string;
  className?: string;
}

export const FrameworkLogo: React.FC<FrameworkLogoProps> = ({ nome, className = "h-16 w-16" }) => {
  const logoMap: Record<string, { icon: any; colors: string }> = {
    // NIST CSF
    "NIST CSF v2.0": {
      icon: Shield,
      colors: "text-blue-900 dark:text-blue-400"
    },
    "NIST Cybersecurity Framework": {
      icon: Shield,
      colors: "text-blue-900 dark:text-blue-400"
    },
    
    // ISO 27001 variants
    "ISO 27001": {
      icon: Lock,
      colors: "text-green-700 dark:text-green-400"
    },
    "ISO/IEC 27001": {
      icon: ShieldCheck,
      colors: "text-green-700 dark:text-green-400"
    },
    "ISO/IEC 27001:2022": {
      icon: Lock,
      colors: "text-green-700 dark:text-green-400"
    },
    
    // ISO 27701 - Privacy
    "ISO/IEC 27701": {
      icon: LockKeyhole,
      colors: "text-purple-700 dark:text-purple-400"
    },
    
    // ISO 14001 - Environmental
    "ISO 14001": {
      icon: Leaf,
      colors: "text-green-600 dark:text-green-500"
    },
    
    // ISO 31000 - Risk Management
    "ISO 31000": {
      icon: AlertTriangle,
      colors: "text-orange-600 dark:text-orange-400"
    },
    
    // ISO 37301 - Compliance
    "ISO 37301": {
      icon: Scale,
      colors: "text-blue-700 dark:text-blue-400"
    },
    
    // ISO 9001 - Quality
    "ISO 9001": {
      icon: Award,
      colors: "text-blue-600 dark:text-blue-400"
    },
    
    // ISO 20000 - IT Service Management
    "ISO/IEC 20000": {
      icon: Server,
      colors: "text-gray-700 dark:text-gray-400"
    },
    
    // LGPD - Brazilian Privacy Law
    "LGPD": {
      icon: Flag,
      colors: "text-yellow-600 dark:text-yellow-500"
    },
    "LGPD 2020": {
      icon: Flag,
      colors: "text-yellow-600 dark:text-yellow-500"
    },
    
    // GDPR - European Privacy
    "GDPR": {
      icon: Globe,
      colors: "text-blue-800 dark:text-blue-400"
    },
    
    // PCI DSS
    "PCI DSS": {
      icon: CreditCard,
      colors: "text-red-700 dark:text-red-400"
    },
    "PCI DSS v4.0": {
      icon: CreditCard,
      colors: "text-red-700 dark:text-red-400"
    },
    
    // SOC 2
    "SOC 2": {
      icon: ShieldCheck,
      colors: "text-purple-700 dark:text-purple-400"
    },
    "SOC 2 Type II": {
      icon: ShieldCheck,
      colors: "text-purple-700 dark:text-purple-400"
    },
    
    // SOX
    "SOX": {
      icon: Building,
      colors: "text-blue-900 dark:text-blue-500"
    },
    "Sarbanes-Oxley": {
      icon: Building,
      colors: "text-blue-900 dark:text-blue-500"
    },
    
    // COBIT
    "COBIT": {
      icon: Network,
      colors: "text-orange-600 dark:text-orange-400"
    },
    "COBIT 2019": {
      icon: Network,
      colors: "text-orange-600 dark:text-orange-400"
    },
    
    // ITIL
    "ITIL": {
      icon: Settings,
      colors: "text-purple-600 dark:text-purple-400"
    },
    "ITIL v4": {
      icon: Settings,
      colors: "text-purple-600 dark:text-purple-400"
    },
    
    // CIS Controls
    "CIS Controls": {
      icon: Target,
      colors: "text-blue-700 dark:text-blue-400"
    },
    
    // COSO ERM
    "COSO ERM": {
      icon: Crosshair,
      colors: "text-orange-700 dark:text-orange-400"
    },
    
    // COSO Internal Control
    "COSO Internal Control": {
      icon: Layers,
      colors: "text-orange-500 dark:text-orange-300"
    },
    
    // HIPAA
    "HIPAA": {
      icon: Heart,
      colors: "text-green-600 dark:text-green-400"
    },
    
    // NIS2 - EU Cybersecurity Directive
    "NIS2": {
      icon: Globe,
      colors: "text-blue-700 dark:text-blue-400"
    },

    // NIST SP 800-82 - OT/ICS Security
    "NIST SP 800-82": {
      icon: Factory,
      colors: "text-slate-700 dark:text-slate-300"
    },

    // DORA - Digital Operational Resilience Act
    "DORA": {
      icon: Landmark,
      colors: "text-indigo-700 dark:text-indigo-400"
    },

    // ISO/IEC 62443 - IACS Security
    "ISO/IEC 62443": {
      icon: Cog,
      colors: "text-cyan-700 dark:text-cyan-400"
    },
  };

  // Try to find exact match first, then partial match
  let config = logoMap[nome];
  
  if (!config) {
    // Try partial match
    const partialMatch = Object.keys(logoMap).find(key => 
      nome.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(nome.toLowerCase())
    );
    
    if (partialMatch) {
      config = logoMap[partialMatch];
    } else {
      // Default fallback
      config = {
        icon: FileCheck,
        colors: "text-gray-600 dark:text-gray-400"
      };
    }
  }

  const IconComponent = config.icon;

  return (
    <div className={`${config.colors} ${className}`}>
      <IconComponent className="w-full h-full" strokeWidth={1.5} />
    </div>
  );
};
