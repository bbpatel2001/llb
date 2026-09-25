import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color: 'primary' | 'green' | 'blue' | 'purple';
}

export function StatsCard({ icon: Icon, label, value, color }: StatsCardProps) {
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary-100 text-primary-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
