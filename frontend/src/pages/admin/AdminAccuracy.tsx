import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAdminStore } from '../../stores/adminStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Loader2 } from 'lucide-react';
import { InfoBox } from '../../components/ui/InfoBox';

interface AccuracyStats {
  bestAccuracy: number;
  bestDate: string;
  streak: number;
  avgQuestions: number;
  chartData: { date: string; accuracy: number; correct: number; total: number; avgQuestions: number; }[];
  confusionPairs: { actual: string; guessed: string; actualEmoji: string; guessedEmoji: string; }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0A0E17] border border-border p-3 rounded-lg shadow-xl outline-none">
        <p className="font-medium text-text-primary mb-2">{label}</p>
        <div className="space-y-1 text-sm font-mono flex flex-col">
          <span className="text-accent-cyan">Accuracy: {data.accuracy}%</span>
          <span className="text-text-secondary">Correct: {data.correct}/{data.total}</span>
          <span className="text-text-secondary">Avg Questions: {data.avgQuestions}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function AdminAccuracy() {
  const token = useAdminStore(s => s.idToken);
  const [isRunning, setIsRunning] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['adminAccuracy'],
    queryFn: async (): Promise<AccuracyStats> => {
      // Mock fetch
      await new Promise(res => setTimeout(res, 800));
      return {
        bestAccuracy: 94.7,
        bestDate: 'May 10',
        streak: 0,
        avgQuestions: 10.6,
        chartData: [
          { date: 'May 1', accuracy: 80.5, correct: 805, total: 1000, avgQuestions: 16.2 },
          { date: 'May 2', accuracy: 82.3, correct: 823, total: 1000, avgQuestions: 15.8 },
          { date: 'May 3', accuracy: 83.1, correct: 831, total: 1000, avgQuestions: 15.1 },
          { date: 'May 4', accuracy: 81.0, correct: 810, total: 1000, avgQuestions: 15.5 },
          { date: 'May 5', accuracy: 85.6, correct: 856, total: 1000, avgQuestions: 14.2 },
          { date: 'May 6', accuracy: 82.1, correct: 821, total: 1000, avgQuestions: 15.2 },
          { date: 'May 7', accuracy: 84.5, correct: 845, total: 1000, avgQuestions: 14.5 },
          { date: 'May 8', accuracy: 91.2, correct: 912, total: 1000, avgQuestions: 12.1 },
          { date: 'May 9', accuracy: 93.5, correct: 935, total: 1000, avgQuestions: 11.2 },
          { date: 'May 10', accuracy: 94.7, correct: 947, total: 1000, avgQuestions: 10.6 },
        ],
        confusionPairs: [
          { actual: 'Monaco', guessed: 'Vatican City', actualEmoji: '🇲🇨', guessedEmoji: '🇻🇦' },
          { actual: 'Liechtenstein', guessed: 'San Marino', actualEmoji: '🇱🇮', guessedEmoji: '🇸🇲' },
          { actual: 'Andorra', guessed: 'Liechtenstein', actualEmoji: '🇦🇩', guessedEmoji: '🇱🇮' },
          { actual: 'Guinea-Bissau', guessed: 'Guinea', actualEmoji: '🇬🇼', guessedEmoji: '🇬🇳' },
          { actual: 'Bhutan', guessed: 'Nepal', actualEmoji: '🇧🇹', guessedEmoji: '🇳🇵' },
        ]
      };
    },
    enabled: !!token
  });

  const handleRunTest = async () => {
    setIsRunning(true);
    setTestStatus(null);
    try {
      // Mock API call: POST /api/admin/accuracy/run
      await new Promise(res => setTimeout(res, 2000));
      setTestStatus("Test started! Results will appear after it completes.");
    } catch (e) {
      setTestStatus("Failed to start test.");
    } finally {
      setIsRunning(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Accuracy Testing</h1>
        <InfoBox variant="error" title="Failed to load stats">
          Unable to load — check backend connection. {error instanceof Error ? error.message : String(error)}
        </InfoBox>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Accuracy Testing</h1>
          <p className="text-text-secondary">Last run: {isLoading ? '...' : (stats?.chartData[stats.chartData.length - 1]?.date || 'Never run')}</p>
        </div>
        <div>
           <button 
            onClick={handleRunTest}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 bg-text-primary text-black font-medium py-2.5 px-6 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isRunning ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Test running...</>
            ) : (
               "Run Test Now"
            )}
          </button>
        </div>
      </div>

      {testStatus && (
        <div className="mb-8">
           <InfoBox variant={testStatus.includes("Failed") ? "error" : "info"} title="Test Status">
            {testStatus}
           </InfoBox>
        </div>
      )}

      {/* Chart */}
      <div className="bg-bg-surface border border-border p-6 rounded-2xl mb-8 h-[400px]">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-bg-elevated border-t-accent-cyan rounded-full animate-spin"></div>
             <p className="text-text-muted animate-pulse">Loading accuracy data...</p>
          </div>
        ) : !stats?.chartData.length ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-text-secondary">No accuracy data yet. Run your first test!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A384C" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280" 
                tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                tickMargin={10} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#6B7280" 
                tick={{ fill: '#9CA3AF', fontSize: 12, fontFamily: 'monospace' }} 
                tickFormatter={(val) => `${val}%`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={95} stroke="#F59E0B" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Target 95%', fill: '#F59E0B', fontSize: 12 }} />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#00C2FF" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#00C2FF', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#FFFFFF', stroke: '#00C2FF', strokeWidth: 2 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-bg-surface border border-border p-5 rounded-xl">
           <p className="text-sm text-text-secondary mb-1">Best accuracy</p>
           {isLoading ? (
             <div className="h-6 w-32 bg-bg-elevated animate-pulse rounded"></div>
           ) : (
             <p className="font-mono font-bold text-text-primary text-xl">
               {stats?.bestAccuracy}% <span className="text-sm font-sans font-normal text-text-muted">on {stats?.bestDate}</span>
             </p>
           )}
        </div>
        <div className="bg-bg-surface border border-border p-5 rounded-xl">
           <p className="text-sm text-text-secondary mb-1">Current streak</p>
           {isLoading ? (
             <div className="h-6 w-24 bg-bg-elevated animate-pulse rounded"></div>
           ) : (
             <p className="font-mono font-bold text-text-primary text-xl">
               {stats?.streak} days <span className="text-sm font-sans font-normal text-text-muted">above 95%</span>
             </p>
           )}
        </div>
        <div className="bg-bg-surface border border-border p-5 rounded-xl">
           <p className="text-sm text-text-secondary mb-1">Average questions to solve</p>
           {isLoading ? (
             <div className="h-6 w-16 bg-bg-elevated animate-pulse rounded"></div>
           ) : (
             <p className="font-mono font-bold text-text-primary text-xl">
               {stats?.avgQuestions.toFixed(1)}
             </p>
           )}
        </div>
      </div>

      {/* Confusion Analysis */}
      <h2 className="text-xl font-bold text-text-primary mb-2">Confusion Analysis</h2>
      <p className="text-sm text-text-muted mb-4">These places need more discriminating questions (from latest test).</p>
      
      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-elevated border-b border-border">
              <th className="py-4 px-6 font-medium text-text-secondary text-sm">Actual Place</th>
              <th className="py-4 px-6 font-medium text-text-secondary text-sm w-12 text-center">→</th>
              <th className="py-4 px-6 font-medium text-text-secondary text-sm">Guessed As</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border-subtle">
                  <td className="py-4 px-6"><div className="h-5 w-32 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="py-4 px-6"></td>
                  <td className="py-4 px-6"><div className="h-5 w-32 bg-bg-elevated animate-pulse rounded"></div></td>
                </tr>
              ))
            ) : !stats?.confusionPairs.length ? (
              <tr>
                <td colSpan={3} className="py-8 px-6 text-center text-text-secondary">
                  No confusion data available.
                </td>
              </tr>
            ) : (
              stats?.confusionPairs.map((pair, i) => (
                <tr key={i} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated/50 transition-colors">
                  <td className="py-4 px-6">
                    <span className="text-xl mr-2">{pair.actualEmoji}</span>
                    <span className="font-medium text-text-primary">{pair.actual}</span>
                  </td>
                  <td className="py-4 px-6 text-center text-border-subtle">→</td>
                  <td className="py-4 px-6">
                    <span className="text-xl mr-2">{pair.guessedEmoji}</span>
                    <span className="font-medium text-accent-red/80">{pair.guessed}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
