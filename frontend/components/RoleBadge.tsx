import { Role } from '../lib/types';
import { ROLE_LABELS } from '../lib/auth';
import { cn } from '../lib/utils';

const ROLE_STYLES: Record<Role, string> = {
  mp: 'bg-blue-50 text-blue-700 border-blue-200',
  legal_drafter: 'bg-purple-50 text-purple-700 border-purple-200',
  research_staff: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  oversight_unit: 'bg-slate-100 text-slate-700 border-slate-300',
};

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap',
        ROLE_STYLES[role],
        className
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
