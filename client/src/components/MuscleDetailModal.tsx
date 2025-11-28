import { useMemo } from 'react';
import { X } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { MUSCLE_GROUPS, type Workout, type UserProfile } from '@shared/schema';
import { formatDate } from '@/lib/training';
import { MuscleTarget } from './MuscleTarget';

interface MuscleDetailModalProps {
  muscle: string;
  workouts: Workout[];
  stats: { actualVolume: Record<string, number> };
  onClose: () => void;
  user: UserProfile;
}

export function MuscleDetailModal({
  muscle,
  workouts,
  stats,
  onClose,
  user
}: MuscleDetailModalProps) {
  const muscleData = MUSCLE_GROUPS[muscle as keyof typeof MUSCLE_GROUPS];
  
  const chartData = useMemo(() => {
    return workouts
      .filter(w => w.exercises.some(ex => ex.muscle === muscle))
      .sort((a, b) => a.date - b.date)
      .map(w => {
        const sets = w.exercises
          .filter(ex => ex.muscle === muscle)
          .reduce((acc, ex) => acc + ex.sets.length, 0);
        return {
          date: formatDate(w.date),
          sets
        };
      });
  }, [workouts, muscle]);

  const exerciseBreakdown = useMemo(() => {
    const breakdown: Record<string, { name: string; sets: number; totalWeight: number }> = {};
    
    workouts.forEach(w => {
      w.exercises
        .filter(ex => ex.muscle === muscle)
        .forEach(ex => {
          if (!breakdown[ex.id]) {
            breakdown[ex.id] = { name: ex.name, sets: 0, totalWeight: 0 };
          }
          breakdown[ex.id].sets += ex.sets.length;
          breakdown[ex.id].totalWeight += ex.sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
        });
    });
    
    return Object.values(breakdown).sort((a, b) => b.sets - a.sets);
  }, [workouts, muscle]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fadeIn">
      <div className="bg-[#111827] w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/5">
        <div 
          className="p-6 border-b flex justify-between items-center"
          style={{ backgroundColor: muscleData?.bg, borderColor: `${muscleData?.color}20` }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-16">
              <MuscleTarget muscle={muscle as any} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: muscleData?.text }}>
                {muscleData?.label}
              </h2>
              <p className="text-sm opacity-70" style={{ color: muscleData?.text }}>
                {stats.actualVolume[muscle] || 0} подходов за период
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/30 rounded-full transition-colors"
            data-testid="button-close-muscle-modal"
          >
            <X size={20} style={{ color: muscleData?.text }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#111827]">
          {chartData.length > 0 ? (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                Динамика подходов
              </h3>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`color${muscle}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={muscleData?.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={muscleData?.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        backgroundColor: '#1A1F2E',
                        color: '#fff'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sets" 
                      name="Подходы"
                      stroke={muscleData?.color} 
                      strokeWidth={3} 
                      fill={`url(#color${muscle})`} 
                      activeDot={{ r: 6, strokeWidth: 0, fill: muscleData?.color }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Нет данных за выбранный период</p>
            </div>
          )}

          {exerciseBreakdown.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                Упражнения
              </h3>
              <div className="space-y-2">
                {exerciseBreakdown.map((ex, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#1A1F2E] rounded-2xl"
                    data-testid={`exercise-breakdown-${idx}`}
                  >
                    <span className="font-medium text-gray-200 truncate mr-4">
                      {ex.name}
                    </span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-gray-300">
                        {ex.sets} <span className="text-gray-500 font-normal">sets</span>
                      </span>
                      <span className="text-gray-600">|</span>
                      <span className="font-mono text-gray-400">
                        {(ex.totalWeight / 1000).toFixed(1)}т
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
