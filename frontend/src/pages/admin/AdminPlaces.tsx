import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAdminStore } from '../../stores/adminStore';
import { Search, Filter, ShieldCheck, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';

interface Place {
  id: string;
  name: string;
  emoji: string;
  type: string;
  qualityScore: number;
  isVerified: boolean;
  createdAt: string;
}

export default function AdminPlaces() {
  const token = useAdminStore(s => s.idToken);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const { data: places = [], isLoading } = useQuery({
    queryKey: ['adminPlaces'],
    queryFn: async (): Promise<Place[]> => {
      // Mock fetch
      await new Promise(res => setTimeout(res, 800));
      return Array.from({ length: 115 }).map((_, i) => ({
        id: `pl_${i}`,
        name: ['France', 'Japan', 'Brazil', 'Canada', 'Australia', 'Egypt', 'India', 'Mexico', 'Italy', 'South Africa'][i % 10] + (i > 9 ? ` ${i}` : ''),
        emoji: ['🇫🇷', '🇯🇵', '🇧🇷', '🇨🇦', '🇦🇺', '🇪🇬', '🇮🇳', '🇲🇽', '🇮🇹', '🇿🇦'][i % 10],
        type: 'Country',
        qualityScore: Math.floor(80 + Math.random() * 20),
        isVerified: Math.random() > 0.2,
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }));
    },
    enabled: !!token
  });

  const filteredPlaces = places.filter(p => {
    if (typeFilter !== 'All' && p.type !== typeFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Simple hardcoded pagination for demo
  const pageSize = 50;
  const totalPages = Math.ceil(filteredPlaces.length / pageSize);
  const [page, setPage] = useState(1);
  const currentPlaces = filteredPlaces.slice((page - 1) * pageSize, page * pageSize);

  const getQualityColor = (score: number) => {
    if (score >= 95) return "text-accent-green";
    if (score >= 85) return "text-accent-amber";
    return "text-accent-red";
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto pb-32">
       <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
            Places Directory
            <Badge variant="outline" className="bg-bg-elevated border-border-subtle text-text-secondary text-xs">
              Coming Soon: Editing
            </Badge>
          </h1>
          <p className="text-text-secondary">Manage the database of known locations.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search places..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-bg-surface border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan"
          />
        </div>
        <div className="relative min-w-[200px]">
           <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
           <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="w-full appearance-none bg-bg-surface border border-border rounded-lg pl-9 pr-8 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:border-accent-cyan"
           >
             {['All', 'Country', 'City', 'Landmark', 'Natural', 'Historical'].map(t => (
               <option key={t} value={t}>{t}</option>
             ))}
           </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-bg-elevated border-b border-border">
              <th className="py-4 px-6 font-medium text-text-secondary text-sm w-12 text-center"></th>
              <th className="py-4 px-6 font-medium text-text-secondary text-sm w-[30%]">Name</th>
              <th className="py-4 px-6 font-medium text-text-secondary text-sm">Type</th>
              <th className="py-4 px-6 font-medium text-text-secondary text-sm">Quality</th>
              <th className="py-4 px-6 font-medium text-text-secondary text-sm">Status</th>
              <th className="py-4 px-6 font-medium text-text-secondary text-sm text-right">Added</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
               Array.from({ length: 15 }).map((_, i) => (
                <tr key={i} className="border-b border-border-subtle">
                  <td className="py-4 px-6"><div className="h-6 w-6 bg-bg-elevated animate-pulse rounded-full mx-auto"></div></td>
                  <td className="py-4 px-6"><div className="h-4 w-32 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="py-4 px-6"><div className="h-4 w-20 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="py-4 px-6"><div className="h-4 w-12 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="py-4 px-6"><div className="h-4 w-24 bg-bg-elevated animate-pulse rounded"></div></td>
                  <td className="py-4 px-6"><div className="h-4 w-24 bg-bg-elevated animate-pulse rounded ml-auto"></div></td>
                </tr>
              ))
            ) : currentPlaces.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 px-6 text-center">
                  <Info className="w-8 h-8 text-border-subtle mx-auto mb-3" />
                  <p className="text-text-secondary">No places found matching your filters.</p>
                </td>
              </tr>
            ) : (
              currentPlaces.map(p => (
                <tr key={p.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated/50 transition-colors group">
                  <td className="py-3 px-6 text-xl text-center">{p.emoji}</td>
                  <td className="py-3 px-6 font-medium text-text-primary group-hover:text-accent-cyan transition-colors">{p.name}</td>
                  <td className="py-3 px-6 text-sm text-text-secondary">{p.type}</td>
                  <td className="py-3 px-6 text-sm font-mono">
                    <span className={getQualityColor(p.qualityScore)}>{p.qualityScore}/100</span>
                  </td>
                  <td className="py-3 px-6 text-sm">
                    {p.isVerified ? (
                      <span className="flex items-center gap-1.5 text-accent-green/80 bg-accent-green/10 w-fit px-2 py-0.5 rounded-full border border-accent-green/20">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-text-muted">Draft</span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-sm text-text-secondary font-mono text-right">{p.createdAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

       {/* Pagination */}
       {!isLoading && totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-text-secondary">
             Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredPlaces.length)} of {filteredPlaces.length} entries
          </p>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-bg-surface border border-border rounded-md text-sm font-medium hover:bg-bg-elevated disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              disabled={page === totalPages}
               onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-bg-surface border border-border rounded-md text-sm font-medium hover:bg-bg-elevated disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
