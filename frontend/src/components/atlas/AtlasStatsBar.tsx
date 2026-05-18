import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDetailedHealth } from '../../api/health';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../lib/utils';

export interface AtlasStatsBarProps {
  showZero?: boolean;
  className?: string;
}

const mapTypeToEmoji = (type: string) => {
  switch (type.toLowerCase()) {
    case 'country': return '🌍';
    case 'city': return '🏙️';
    case 'landmark': return '🗼';
    case 'natural': return '🏞️';
    case 'historical': return '🏛️';
    case 'religious': return '🕍';
    case 'geographic': return '🏔️';
    case 'tourist_spot': return '📸';
    default: return '📍';
  }
};

const formatTypeName = (type: string, count: number) => {
  const name = type.replace(/_/g, ' ');
  if (count === 1) return name;
  if (name.endsWith('y')) return name.slice(0, -1) + 'ies';
  if (name.endsWith('s')) return name;
  return name + 's';
};

export const AtlasStatsBar: React.FC<AtlasStatsBarProps> = ({ showZero = false, className }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['health', 'detailed'],
    queryFn: getDetailedHealth,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className={cn("flex space-x-3 items-center", className)}>
        <Skeleton className="w-24 h-4 rounded-md" />
        <Skeleton className="w-24 h-4 rounded-md" />
        <Skeleton className="w-24 h-4 rounded-md" />
      </div>
    );
  }

  if (!data?.data_stats) return null;

  const validStats = Object.entries(data.data_stats)
    .filter(([_, stat]) => showZero || stat.count > 0)
    .sort((a, b) => b[1].count - a[1].count);

  if (validStats.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 justify-center font-mono text-xs text-text-muted", className)}>
      {validStats.map(([type, stat]) => (
        <span key={type} className="flex items-center space-x-1.5 whitespace-nowrap">
          <span className="opacity-80">{mapTypeToEmoji(type)}</span>
          <span className="font-semibold text-text-secondary">{stat.count}</span>
          <span className="lowercase">{formatTypeName(type, stat.count)}</span>
        </span>
      ))}
    </div>
  );
};
