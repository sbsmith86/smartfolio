import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Rocket, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'active' | 'demo' | 'soon';
}

const statusConfig = {
  active: {
    label: 'Active',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-100',
    emoji: '✅',
  },
  demo: {
    label: 'Ships in Demo',
    icon: Rocket,
    className: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100',
    emoji: '🚀',
  },
  soon: {
    label: 'Coming Soon',
    icon: Clock,
    className: 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-100',
    emoji: '⏳',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      <span className="mr-1">{config.emoji}</span>
      {config.label}
    </Badge>
  );
}
