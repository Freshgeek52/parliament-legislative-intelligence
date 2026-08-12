import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { GapSeverity } from '../lib/types';
import { useLanguage } from '../lib/i18n';
import { cn } from '../lib/utils';

const SEVERITY_STYLES: Record<GapSeverity, string> = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  minor: 'bg-blue-50 text-blue-700 border-blue-200',
};

const SEVERITY_ICONS: Record<GapSeverity, typeof AlertOctagon> = {
  critical: AlertOctagon,
  moderate: AlertTriangle,
  minor: Info,
};

interface SeverityBadgeProps {
  severity: GapSeverity;
  className?: string;
}

export default function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const { t } = useLanguage();
  const Icon = SEVERITY_ICONS[severity];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border',
        SEVERITY_STYLES[severity],
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {t(`common.${severity}`)}
    </span>
  );
}
