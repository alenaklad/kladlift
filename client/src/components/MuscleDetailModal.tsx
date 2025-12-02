import { useMemo, useState } from 'react';
import { X, Sparkles, Loader2, Dumbbell, TrendingUp, Target } from 'lucide-react';
import { MUSCLE_GROUPS, type Workout, type UserProfile } from '@shared/schema';
import { MuscleTarget } from './MuscleTarget';
import { apiRequest } from '@/lib/queryClient';

function pluralizeSets(count: number): string {
  const absCount = Math.abs(count);
  const lastTwo = absCount % 100;
  const lastOne = absCount % 10;
  
  if (lastTwo >= 11 && lastTwo <= 19) {
    return `${count} подходов`;
  }
  if (lastOne === 1) {
    return `${count} подход`;
  }
  if (lastOne >= 2 && lastOne <= 4) {
    return `${count} подхода`;
  }
  return `${count} подходов`;
}

interface MuscleDetailModalProps {
  muscle: string;
  workouts: Workout[];
  stats: { actualVolume: Record<string, number>; targetVolume?: Record<string, { mrv: number; mev: number }> };
  onClose: () => void;
  user: UserProfile;
}

interface AIAnalysis {
  status: 'completed' | 'partial' | 'minimal';
  message: string;
  recommendations: string[];
  exercises?: { name: string; sets: number; reps: string; weight: string }[];
}

export function MuscleDetailModal({
  muscle,
  workouts,
  stats,
  onClose,
  user
}: MuscleDetailModalProps) {
  const muscleData = MUSCLE_GROUPS[muscle as keyof typeof MUSCLE_GROUPS];
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const exerciseBreakdown = useMemo(() => {
    const breakdown: Record<string, { name: string; sets: number; totalWeight: number; avgWeight: number; avgReps: number }> = {};
    
    workouts.forEach(w => {
      w.exercises
        .filter(ex => ex.muscle === muscle)
        .forEach(ex => {
          if (!breakdown[ex.id]) {
            breakdown[ex.id] = { name: ex.name, sets: 0, totalWeight: 0, avgWeight: 0, avgReps: 0 };
          }
          breakdown[ex.id].sets += ex.sets.length;
          const validSets = ex.sets.filter(s => s.weight && s.reps);
          if (validSets.length > 0) {
            const totalWeight = validSets.reduce((acc, s) => acc + (s.weight || 0), 0);
            const totalReps = validSets.reduce((acc, s) => acc + (s.reps || 0), 0);
            breakdown[ex.id].avgWeight = totalWeight / validSets.length;
            breakdown[ex.id].avgReps = totalReps / validSets.length;
          }
          breakdown[ex.id].totalWeight += ex.sets.reduce((acc, s) => acc + (s.weight || 0) * (s.reps || 0), 0);
        });
    });
    
    return Object.values(breakdown).sort((a, b) => b.sets - a.sets);
  }, [workouts, muscle]);

  const actualSets = stats.actualVolume[muscle] || 0;
  const targetSets = stats.targetVolume?.[muscle]?.mrv || 0;
  const completionPercent = targetSets > 0 ? Math.round((actualSets / targetSets) * 100) : 0;

  const fetchAIAnalysis = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    
    try {
      const response = await apiRequest('POST', '/api/coach/volume-review', {
        muscle,
        muscleLabel: muscleData?.label,
        actualSets,
        targetSets,
        completionPercent,
        exercises: exerciseBreakdown.map(ex => ({
          name: ex.name,
          sets: ex.sets,
          avgWeight: ex.avgWeight,
          avgReps: ex.avgReps
        })),
        userGoal: user.goal,
        experienceYears: user.experienceYears
      });
      
      const data = await response.json();
      setAiAnalysis(data);
    } catch (error) {
      setAiError('Не удалось получить анализ. Попробуйте позже.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fadeIn">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {targetSets > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-600">Прогресс недели</span>
                <span className="text-sm font-bold" style={{ color: muscleData?.color }}>
                  {completionPercent}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(completionPercent, 100)}%`,
                    backgroundColor: muscleData?.color 
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{pluralizeSets(actualSets)} выполнено</span>
                <span>Цель: {pluralizeSets(targetSets)}</span>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Sparkles size={16} className="text-purple-600" />
                </div>
                <h3 className="font-bold text-slate-800">ИИ-тренер</h3>
              </div>
              {!aiAnalysis && !isLoadingAI && (
                <button
                  onClick={fetchAIAnalysis}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors"
                  data-testid="button-get-ai-analysis"
                >
                  Получить анализ
                </button>
              )}
            </div>

            {isLoadingAI && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="text-purple-600 animate-spin" />
                <span className="ml-2 text-purple-600 font-medium">Анализирую...</span>
              </div>
            )}

            {aiError && (
              <div className="text-center py-4 text-red-500 text-sm">
                {aiError}
              </div>
            )}

            {aiAnalysis && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  {aiAnalysis.status === 'completed' && (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={16} className="text-green-600" />
                    </div>
                  )}
                  {aiAnalysis.status === 'partial' && (
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target size={16} className="text-amber-600" />
                    </div>
                  )}
                  {aiAnalysis.status === 'minimal' && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Dumbbell size={16} className="text-blue-600" />
                    </div>
                  )}
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {aiAnalysis.message}
                  </p>
                </div>

                {aiAnalysis.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Рекомендации
                    </h4>
                    <ul className="space-y-1">
                      {aiAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiAnalysis.exercises && aiAnalysis.exercises.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      План на неделю
                    </h4>
                    <div className="space-y-2">
                      {aiAnalysis.exercises.map((ex, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white rounded-xl border border-purple-100"
                        >
                          <span className="font-medium text-slate-700 text-sm truncate mr-2">
                            {ex.name}
                          </span>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-purple-600">
                              {pluralizeSets(ex.sets)}
                            </span>
                            <span className="text-slate-400">×</span>
                            <span className="text-slate-600">{ex.reps}</span>
                            <span className="text-slate-400">@</span>
                            <span className="font-mono text-slate-600">{ex.weight}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!aiAnalysis && !isLoadingAI && !aiError && (
              <p className="text-sm text-slate-500 text-center py-2">
                Получите персональный анализ нагрузки и рекомендации
              </p>
            )}
          </div>

          {exerciseBreakdown.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Упражнения
              </h3>
              <div className="space-y-2">
                {exerciseBreakdown.map((ex, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
                    data-testid={`exercise-breakdown-${idx}`}
                  >
                    <span className="font-medium text-slate-700 truncate mr-4">
                      {ex.name}
                    </span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-slate-700">
                        {pluralizeSets(ex.sets)}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="font-mono text-slate-500">
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
