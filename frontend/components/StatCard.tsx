import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: 'primary' | 'accent' | 'red' | 'blue';
  hint?: string;
}

const ACCENT_STYLES: Record<NonNullable<StatCardProps['accent']>, string> = {
  primary: 'bg-primary-50 text-primary-700',
  accent: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-blue-50 text-blue-700',
};

export default function StatCard({ icon: Icon, label, value, accent = 'primary', hint }: StatCardProps) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      </div>
      <div className={cn('rounded-lg p-3', ACCENT_STYLES[accent])}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
