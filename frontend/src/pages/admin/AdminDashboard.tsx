import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAdminStore } from '../../stores/adminStore';
import { Globe, HelpCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { InfoBox } from '../../components/ui/InfoBox';

interface DashboardStats {
  totalPlaces: number;
  totalQuestions: number;
  latestAccuracy: number;
  accuracyTrend: 'up' | 'down' | 'neutral';
  accuracyChange: number;
  placesByType: Record<string, number>;
  recentAnalytics: {
    date: string;
    accuracy: number;
    total: number;
    correct: number;
    avgQuestions: number;
  }[];
}

export default function AdminDashboard() {
  const token = useAdminStore(s => s.idToken);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Mocking fetch as the backend is not fully implemented yet
      // In a real scenario we'd do: fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` }})
      await new Promise(res => setTimeout(res, 800));
      return {
        totalPlaces: 115,
        totalQuestions: 4230,
        latestAccuracy: 94.7,
        accuracyTrend: 'up',
        accuracyChange: 1.2,
        placesByType: {
          'Country': 115,
          'City': 0,
          'Landmark': 0
        },
        recentAnalytics: [
          { date: 'May 10', accuracy: 94.7, total: 1000, correct: 947, avgQuestions: 10.6 },
          { date: 'May 9', accuracy: 93.5, total: 1000, correct: 935, avgQuestions: 11.2 },
          { date: 'May 8', accuracy: 91.2, total: 1000, correct: 912, avgQuestions: 12.1 },
          { date: 'May 7', accuracy: 84.5, total: 1000, correct: 845, avgQuestions: 14.5 },
          { date: 'May 6', accuracy: 82.1, total: 1000, correct: 821, avgQuestions: 15.2 },
        ]
      };
    },
    enabled: !!token
  });

  if (error) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Dashboard</h1>
        <InfoBox variant="error" title="Failed to load dashboard">
          Unable to load — check backend connection. {error instanceof Error ? error.message : String(error)}
        </InfoBox>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        
        {/* Card 1 */}
        <div className="bg-bg-surface border border-border p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Total Places</p>
            {isLoading ? (
              <div className="h-10 w-24 bg-bg-elevated animate-pulse rounded"></div>
            ) : (
              <p className="text-4xl font-mono font-bold text-accent-cyan">{stats?.totalPlaces.toLocaleString()}</p>
            )}
          </div>
          <div className="bg-bg-elevated p-4 rounded-xl">
            <Globe className="w-8 h-8 text-accent-cyan" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-bg-surface border border-border p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Total Questions</p>
            {isLoading ? (
              <div className="h-10 w-24 bg-bg-elevated animate-pulse rounded"></div>
            ) : (
              <p className="text-4xl font-mono font-bold text-accent-green">{stats?.totalQuestions.toLocaleString()}</p>
            )}
          </div>
          <div className="bg-bg-elevated p-4 rounded-xl">
            <HelpCircle className="w-8 h-8 text-accent-green" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-bg-surface border border-border p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Latest Accuracy</p>
             {isLoading ? (
              <div className="h-10 w-24 bg-bg-elevated animate-pulse rounded"></div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-4xl font-mono font-bold text-accent-amber">{stats?.latestAccuracy}%</p>
                <div className={cn(
                  "flex items-center text-sm font-medium px-2 py-1 rounded",
                  stats?.accuracyTrend === 'up' ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
                )}>
                  {stats?.accuracyTrend === 'up' ? <TrendingUp className="w-4 h-4 mr-1"/> : <TrendingDown className="w-4 h-4 mr-1"/>}
                  {stats?.accuracyChange}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 4 */}
         <div className="bg-bg-surface border border-border p-6 rounded-2xl flex flex-col justify-center">
          <p className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Places by Type</p>
           {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-full bg-bg-elevated animate-pulse rounded"></div>
                <div className="h-4 w-3/4 bg-bg-elevated animate-pulse rounded"></div>
              </div>
            ) : (
              <div className="flex gap-4">
                {Object.entries(stats?.placesByType || {}).map(([type, count]) => (
                  <div key={type} className="flex-1 bg-bg-base/50 p-3 flex justify-between items-center rounded-lg border border-border-subtle">
                    <span className="text-text-secondary">{type}</span>
                    <span className="font-mono font-bold text-text-primary">{count}</span>
                  </div>
                ))}
              </div>
            )}
        </div>

      </div>

      {/* Analytics Table */}
      <h2 className="text-xl font-bold text-text-primary mb-4">Recent Tests</h2>
      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-bg-elevated border-b border-border">
              <th className="py-4 px-6 font-medium text-text-secondary text-sm">Date</th>
              <th className="py-4 px-6 font-medium text-text-secondary text-sm">Accuracy</th>
              <th className="py-4 px-6 font-medium text-text-secondary text-sm">Total Games</th>
              <th className="py-4 px-6 font-medium text-text-secondary text-sm">Correct</th>
              <th className="py-4 px-6 font-medium text-text-secondary text-sm">Avg Questions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border-subtle">
                  <td className="py-4 px-6"><div className="h-4 w-24 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="py-4 px-6"><div className="h-4 w-12 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="py-4 px-6"><div className="h-4 w-16 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="py-4 px-6"><div className="h-4 w-16 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="py-4 px-6"><div className="h-4 w-16 bg-bg-elevated animate-pulse rounded"></div></td>
                </tr>
              ))
            ) : stats?.recentAnalytics.length === 0 ? (
               <tr>
                <td colSpan={5} className="py-8 px-6 text-center text-text-secondary">
                  No tests run recently.
                </td>
              </tr>
            ) : (
              stats?.recentAnalytics.map((row, i) => (
                <tr key={i} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-text-primary">{row.date}</td>
                  <td className="py-4 px-6">
                    <span className={cn(
                      "px-2.5 py-1 rounded font-mono font-bold text-sm inline-block",
                      row.accuracy >= 95 ? "bg-accent-green/10 text-accent-green" : 
                      row.accuracy >= 85 ? "bg-accent-amber/10 text-accent-amber" : 
                      "bg-accent-red/10 text-accent-red"
                    )}>
                      {row.accuracy.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-text-secondary">{row.total}</td>
                  <td className="py-4 px-6 font-mono text-text-secondary">{row.correct}</td>
                  <td className="py-4 px-6 font-mono text-text-secondary">{row.avgQuestions.toFixed(1)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
