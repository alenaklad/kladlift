import { useState, useMemo, useCallback } from 'react';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { RefreshCw } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Target, 
  Clock, 
  ChevronRight,
  ChevronLeft,
  Plus, 
  Scale, 
  Activity,
  Calendar,
  Flame,
  Trophy,
  TrendingUp,
  Zap
} from 'lucide-react';
import { 
  GOALS, 
  MUSCLE_GROUPS, 
  getCardioType,
  type UserProfile, 
  type Workout, 
  type BodyLog 
} from '@shared/schema';
import { formatDate } from '@/lib/training';
import { 
  calculateFullProgram, 
  getRangeFilter, 
  getCyclePhaseForDate 
} from '@/lib/training';
import { BodyStatsManager } from './BodyStatsManager';
import { MuscleDetailModal } from './MuscleDetailModal';
import { WeeklyStories, isStoryTimeActive } from './WeeklyStories';
import { Sparkles } from 'lucide-react';

interface WeeklyProgressBarProps {
  workouts: Workout[];
  trainingDays: number;
}

function WeeklyProgressBar({ workouts, trainingDays }: WeeklyProgressBarProps) {
  const progress = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - daysToMonday);
    thisMonday.setHours(0, 0, 0, 0);
    
    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);
    thisSunday.setHours(23, 59, 59, 999);
    
    const weekWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= thisMonday && workoutDate <= thisSunday;
    });
    
    // Считаем только силовые тренировки (содержащие хотя бы одно НЕ-кардио упражнение)
    const strengthWorkouts = weekWorkouts.filter(w => 
      w.exercises.some(ex => ex.muscle !== 'cardio')
    );
    
    const completed = strengthWorkouts.length;
    const target = trainingDays;
    const percentage = target > 0 ? Math.round((completed / target) * 100) : 0;
    
    const currentDayIndex = daysToMonday;
    const daysPassedRatio = (currentDayIndex + 1) / 7;
    const expectedByNow = Math.round(target * daysPassedRatio);
    
    let status: 'ahead' | 'on_track' | 'behind' | 'critical';
    let color: string;
    let bgColor: string;
    let message: string;
    let icon: 'trophy' | 'flame' | 'trending' | 'zap';
    
    if (completed >= target) {
      status = 'ahead';
      color = 'from-emerald-500 to-green-500';
      bgColor = 'bg-emerald-100 dark:bg-emerald-900/30';
      message = 'План выполнен!';
      icon = 'trophy';
    } else if (completed >= expectedByNow) {
      status = 'on_track';
      color = 'from-green-500 to-emerald-500';
      bgColor = 'bg-green-100 dark:bg-green-900/30';
      message = 'Отлично! Вы на графике';
      icon = 'flame';
    } else if (completed >= expectedByNow - 1 || currentDayIndex < 3) {
      status = 'behind';
      color = 'from-amber-500 to-yellow-500';
      bgColor = 'bg-amber-100 dark:bg-amber-900/30';
      message = currentDayIndex < 3 ? 'Время потренироваться!' : 'Немного отстаёте';
      icon = 'trending';
    } else {
      status = 'critical';
      color = 'from-red-500 to-orange-500';
      bgColor = 'bg-red-100 dark:bg-red-900/30';
      message = 'Не забывайте тренироваться!';
      icon = 'zap';
    }
    
    return { completed, target, percentage, status, color, bgColor, message, icon, currentDayIndex };
  }, [workouts, trainingDays]);
  
  const IconComponent = progress.icon === 'trophy' ? Trophy : 
                        progress.icon === 'flame' ? Flame : 
                        progress.icon === 'trending' ? TrendingUp : Zap;
  
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  return (
    <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 ${progress.bgColor} shadow-sm`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br ${progress.color} flex items-center justify-center shadow-lg`}>
            <IconComponent size={18} className="text-white sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">Недельный план</h3>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">{progress.message}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${progress.color} bg-clip-text text-transparent`}>
            {progress.completed}/{progress.target}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">тренировок</div>
        </div>
      </div>
      
      <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
        <div 
          className={`absolute left-0 top-0 h-full bg-gradient-to-r ${progress.color} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(progress.percentage, 100)}%` }}
        />
        {progress.percentage > 100 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
            +{progress.percentage - 100}%
          </div>
        )}
      </div>
      
      <div className="flex justify-between gap-1">
        {dayNames.map((day, idx) => {
          const isPast = idx < progress.currentDayIndex;
          const isCurrent = idx === progress.currentDayIndex;
          
          return (
            <div 
              key={day}
              className={`
                w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium transition-all
                ${isCurrent 
                  ? `bg-gradient-to-br ${progress.color} text-white shadow-md ring-2 ring-white dark:ring-slate-800` 
                  : isPast 
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }
              `}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number;
    unit?: string;
  }>;
  label?: string;
  unit?: string;
}

function CustomTooltip({ active, payload, label, unit = 'кг' }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-slate-200">
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <p className="text-sm font-bold text-slate-900">
                {entry.name}: <span className="font-mono text-base">{entry.value}</span>
                <span className="text-xs text-slate-500 font-medium ml-0.5">{entry.unit || unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

interface DashboardProps {
  user: UserProfile;
  workouts: Workout[];
  bodyLogs: BodyLog[];
  onLogClick: () => void;
  onUpdateBody: (weight: number, fat: number | undefined, date: number) => void;
  onDeleteBodyLog: (id: string) => void;
  onOpenHistory: () => void;
  onOpenCoach: () => void;
  onOpenCycle: () => void;
  onOpenGoal: () => void;
  onRefresh?: () => Promise<void>;
}

function getWeekRange(weekOffset: number): { start: number; end: number; label: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysToMonday);
  
  const targetMonday = new Date(thisMonday);
  targetMonday.setDate(thisMonday.getDate() + weekOffset * 7);
  
  const targetSunday = new Date(targetMonday);
  targetSunday.setDate(targetMonday.getDate() + 6);
  targetSunday.setHours(23, 59, 59, 999);
  
  const formatDate = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const label = weekOffset === 0 
    ? 'Эта неделя' 
    : weekOffset === -1 
      ? 'Прошлая неделя'
      : `${formatDate(targetMonday)} — ${formatDate(targetSunday)}`;
  
  return {
    start: targetMonday.getTime(),
    end: targetSunday.getTime(),
    label
  };
}

export function Dashboard({
  user,
  workouts,
  bodyLogs,
  onLogClick,
  onUpdateBody,
  onDeleteBodyLog,
  onOpenHistory,
  onOpenCoach,
  onOpenCycle,
  onOpenGoal,
  onRefresh
}: DashboardProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showBodyModal, setShowBodyModal] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showStories, setShowStories] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
    }
  }, [onRefresh]);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    maxPull: 120
  });

  const storyTimeActive = isStoryTimeActive();

  const program = useMemo(() => 
    calculateFullProgram({ ...user, gender: user.gender }), 
    [user]
  );

  const weekRange = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  const filteredWorkouts = useMemo(() => {
    return workouts.filter(w => w.date >= weekRange.start && w.date <= weekRange.end);
  }, [workouts, weekRange]);

  const stats = useMemo(() => {
    const actualVolume: Record<string, number> = { 
      legs: 0, back: 0, chest: 0, shoulders: 0, arms: 0, abs: 0 
    };
    filteredWorkouts.forEach(w => 
      w.exercises.forEach(ex => {
        if (actualVolume[ex.muscle] !== undefined) {
          actualVolume[ex.muscle] += ex.sets.length;
        }
      })
    );
    const targetVolume: Record<string, { mrv: number; mev: number }> = {};
    (Object.keys(MUSCLE_GROUPS) as Array<keyof typeof MUSCLE_GROUPS>).forEach(key => {
      if (key !== 'cardio') {
        targetVolume[key] = { 
          mrv: program.weeklyVolume[key] || 10,
          mev: Math.floor((program.weeklyVolume[key] || 10) * 0.6)
        };
      }
    });
    return { actualVolume, targetVolume };
  }, [filteredWorkouts, program]);

  const cyclePhase = useMemo(() => 
    user.gender === 'female' && user.cycle 
      ? getCyclePhaseForDate(Date.now(), user.cycle.lastPeriod, user.cycle.length) 
      : null, 
    [user]
  );

  const [cardioWeekOffset, setCardioWeekOffset] = useState(0);
  
  const cardioWeekRange = useMemo(() => getWeekRange(cardioWeekOffset), [cardioWeekOffset]);
  
  const cardioFilteredWorkouts = useMemo(() => {
    return workouts.filter(w => w.date >= cardioWeekRange.start && w.date <= cardioWeekRange.end);
  }, [workouts, cardioWeekRange]);
  
  const weeklyCardio = useMemo(() => {
    const cardioWorkouts: Array<{
      date: number;
      exerciseName: string;
      duration: number;
      distance?: number;
      distanceUnit?: string;
      cardioType: string;
    }> = [];
    
    cardioFilteredWorkouts.forEach(w => {
      w.exercises.forEach(ex => {
        const cardioType = getCardioType(ex.id);
        if (cardioType && ex.sets.length > 0) {
          const set = ex.sets[0];
          cardioWorkouts.push({
            date: w.date,
            exerciseName: ex.name,
            duration: set.duration || 0,
            distance: set.distance,
            distanceUnit: set.distanceUnit || 'km',
            cardioType
          });
        }
      });
    });
    
    const totalDuration = cardioWorkouts.reduce((sum, c) => sum + c.duration, 0);
    const totalDistance = cardioWorkouts
      .filter(c => c.cardioType === 'distance' && c.distance)
      .reduce((sum, c) => sum + (c.distance || 0), 0);
    
    return {
      workouts: cardioWorkouts.sort((a, b) => b.date - a.date),
      totalDuration,
      totalDistance,
      count: cardioWorkouts.length
    };
  }, [cardioFilteredWorkouts]);

  const cardioMotivationalTexts = [
    "Кардио улучшает выносливость и ускоряет восстановление между силовыми тренировками!",
    "30 минут кардио в неделю снижает риск сердечно-сосудистых заболеваний на 20%!",
    "Кардио помогает сжигать калории и поддерживать здоровый вес!",
    "Регулярные кардио-тренировки улучшают качество сна и настроение!",
    "Добавьте кардио для улучшения кровообращения и доставки питательных веществ к мышцам!",
    "Даже 15 минут кардио повышают уровень эндорфинов — гормонов счастья!",
    "Кардио укрепляет сердце и делает его более эффективным!",
    "Совмещайте силовые и кардио для максимального результата!"
  ];

  const randomMotivationalText = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return cardioMotivationalTexts[dayOfYear % cardioMotivationalTexts.length];
  }, []);

  const bodyChartData = useMemo(() => 
    bodyLogs
      .sort((a, b) => a.date - b.date)
      .map(log => ({
        date: new Date(log.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        weight: log.weight,
        fat: log.fat
      })), 
    [bodyLogs]
  );

  const hasFatData = user.fat && bodyChartData.some(d => d.fat && d.fat > 0);

  const needsMeasurementReminder = useMemo(() => {
    if (bodyLogs.length === 0) return true;
    const lastLog = bodyLogs.reduce((latest, log) => log.date > latest.date ? log : latest, bodyLogs[0]);
    const daysSinceLastLog = Math.floor((Date.now() - lastLog.date) / (1000 * 60 * 60 * 24));
    return daysSinceLastLog >= 7;
  }, [bodyLogs]);

  return (
    <div 
      ref={containerRef}
      className="px-4 sm:px-6 pt-16 sm:pt-20 pb-28 sm:pb-24 max-w-4xl mx-auto space-y-4 sm:space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen overflow-auto"
      style={{ transform: `translateY(${pullDistance}px)` }}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
          style={{ 
            opacity: Math.min(progress, 1),
            transform: `scale(${0.5 + progress * 0.5})`
          }}
        >
          <div className={`w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center ${isRefreshing ? 'animate-spin' : ''}`}>
            <RefreshCw 
              size={20} 
              className={`text-purple-600 dark:text-purple-400 ${isRefreshing ? '' : ''}`}
              style={{ transform: `rotate(${progress * 360}deg)` }}
            />
          </div>
        </div>
      )}
      <header className="flex justify-between items-center gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/logo.png" alt="KladLift" className="w-10 h-10 sm:w-12 sm:h-12 object-contain pl-[4px] pr-[4px]" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100" data-testid="text-app-title">KladLift</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Твоя система</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {storyTimeActive && (
            <button 
              onClick={() => setShowStories(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 touch-target bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white shadow-lg shadow-purple-500/30 active:scale-95 transition-transform"
              data-testid="button-weekly-stories"
            >
              <Sparkles size={18} />
              <span className="font-medium text-xs sm:text-sm">Итоги</span>
            </button>
          )}
          <button 
            onClick={onOpenHistory} 
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 touch-target bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
            data-testid="button-history"
          >
            <Clock size={18} />
            <span className="font-medium text-xs sm:text-sm">История</span>
          </button>
        </div>
      </header>
      <WeeklyProgressBar 
        workouts={workouts} 
        trainingDays={user.trainingDays}
      />
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-slate-900 text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-4 sm:gap-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl" />
        </div>
        <div 
          className="relative z-10 flex-1 cursor-pointer active:opacity-80 transition-opacity touch-target"
          onClick={onOpenGoal}
          data-testid="card-goal"
        >
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 text-purple-200 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <Target size={14}/> Цель <ChevronRight size={14} className="opacity-50" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1 text-white" data-testid="text-goal">
            {GOALS[user.goal]?.label}
          </h2>
          <p className="text-purple-200 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
            {program.trainingParams.goalDescription}
          </p>
          <div className="flex gap-4 sm:gap-6">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-white" data-testid="text-base-sets">
                {program.meta.standardSets}
              </div>
              <div className="text-[9px] sm:text-[10px] text-purple-200 uppercase">База (сеты)</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-green-400" data-testid="text-recovery-factor">
                x{program.meta.recoveryMultiplier.toFixed(2)}
              </div>
              <div className="text-[9px] sm:text-[10px] text-purple-200 uppercase">Фактор восст.</div>
            </div>
          </div>
        </div>
        
        {cyclePhase && (
          <div 
            className="relative z-10 flex flex-col justify-center bg-white/10 backdrop-blur-sm p-4 rounded-2xl md:w-1/3 cursor-pointer hover:bg-white/20 transition-colors border border-white/10" 
            onClick={onOpenCycle}
            data-testid="card-cycle-phase"
          >
            <div className="flex items-center gap-2 mb-1 text-pink-300 font-bold text-sm">
              <Activity size={16}/> {cyclePhase.name}
            </div>
            <div className="text-xs text-white/80 leading-tight mb-2">
              {cyclePhase.desc}
            </div>
            <div className="mt-auto pt-2 border-t border-white/10 text-[10px] uppercase font-bold text-white/60">
              Совет: {cyclePhase.rec}
            </div>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">Недельный объем</h3>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={() => setWeekOffset(prev => prev - 1)} 
              className="p-2 touch-target bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
              data-testid="button-prev-week"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex flex-col items-center min-w-[90px] sm:min-w-[120px]">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100" data-testid="text-week-label">
                {weekRange.label}
              </span>
              {weekOffset !== 0 && (
                <button 
                  onClick={() => setWeekOffset(0)}
                  className="text-[9px] sm:text-[10px] text-purple-600 dark:text-purple-400 active:text-purple-700 dark:active:text-purple-300 font-medium"
                  data-testid="button-reset-week"
                >
                  К текущей
                </button>
              )}
            </div>
            <button 
              onClick={() => setWeekOffset(prev => Math.min(prev + 1, 0))} 
              disabled={weekOffset >= 0}
              className={`p-2 touch-target rounded-full transition-colors ${
                weekOffset >= 0 
                  ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-600'
              }`}
              data-testid="button-next-week"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {(Object.keys(MUSCLE_GROUPS) as Array<keyof typeof MUSCLE_GROUPS>).map(key => {
            if (key === 'cardio') return null;
            const actual = stats.actualVolume[key] || 0;
            const target = program.weeklyVolume[key] || 10;
            const pct = (actual / target) * 100;
            let barColor = '#22C55E';
            if (actual < target * 0.5) barColor = '#F59E0B';
            if (actual > target) barColor = '#166534';
            
            return (
              <div 
                key={key} 
                onClick={() => setSelectedMuscle(key)} 
                className="cursor-pointer group"
                data-testid={`muscle-progress-${key}`}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    {MUSCLE_GROUPS[key].label} 
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400"/>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">{actual} / {target}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-purple-100 dark:border-purple-900/50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-4">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
            Кардио за неделю
          </h3>
          <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto">
            <button 
              onClick={() => setCardioWeekOffset(prev => prev - 1)} 
              className="p-2 touch-target bg-white dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
              data-testid="button-cardio-prev-week"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex flex-col items-center min-w-[90px] sm:min-w-[120px]">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100" data-testid="text-cardio-week-label">
                {cardioWeekRange.label}
              </span>
              {cardioWeekOffset !== 0 && (
                <button 
                  onClick={() => setCardioWeekOffset(0)}
                  className="text-[9px] sm:text-[10px] text-purple-600 dark:text-purple-400 active:text-purple-700 dark:active:text-purple-300 font-medium"
                  data-testid="button-cardio-reset-week"
                >
                  К текущей
                </button>
              )}
            </div>
            <button 
              onClick={() => setCardioWeekOffset(prev => Math.min(prev + 1, 0))} 
              disabled={cardioWeekOffset >= 0}
              className={`p-2 touch-target rounded-full transition-colors ${
                cardioWeekOffset >= 0 
                  ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700'
              }`}
              data-testid="button-cardio-next-week"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        {weeklyCardio.count > 0 ? (
          <>
            <div className="flex items-center gap-4 text-sm mb-4 pb-3 border-b border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-1">
                <Clock size={14} className="text-purple-500" />
                <span className="font-bold text-slate-700 dark:text-slate-200">{weeklyCardio.totalDuration}</span>
                <span className="text-slate-500 dark:text-slate-400">мин</span>
              </div>
              {weeklyCardio.totalDistance > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{weeklyCardio.totalDistance.toFixed(1)}</span>
                  <span className="text-slate-500 dark:text-slate-400">км</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {weeklyCardio.workouts.slice(0, 5).map((cardio, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white/70 dark:bg-slate-800/50 rounded-xl border border-purple-100 dark:border-purple-900/50"
                  data-testid={`cardio-session-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                      <Activity size={14} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{cardio.exerciseName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(cardio.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-slate-600 dark:text-slate-300">{cardio.duration} мин</span>
                    {cardio.distance && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {cardio.distance.toFixed(1)} {cardio.distanceUnit === 'mi' ? 'ми' : 'км'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {weeklyCardio.count > 5 && (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
                +{weeklyCardio.count - 5} ещё
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-6" data-testid="cardio-motivation">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
              <Activity size={28} className="text-purple-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-xs mx-auto">
              {randomMotivationalText}
            </p>
            <button 
              onClick={onLogClick}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium text-sm hover:bg-purple-700 transition-colors"
              data-testid="button-add-cardio"
            >
              Добавить кардио
            </button>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col relative overflow-hidden">
        {needsMeasurementReminder && (
          <div 
            onClick={() => setShowBodyModal(true)}
            className="mb-3 sm:mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700 rounded-xl sm:rounded-2xl cursor-pointer active:from-amber-100 active:to-orange-100 dark:active:from-amber-900/40 dark:active:to-orange-900/40 transition-colors touch-target"
            data-testid="reminder-measurement"
          >
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Scale size={16} />
              <span className="text-xs sm:text-sm font-medium">Пора обновить параметры тела</span>
            </div>
            <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-500 mt-1">Добавьте замер для отслеживания прогресса</p>
          </div>
        )}
        <div className="flex justify-between items-start mb-2 relative z-10">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" /> Тело
          </h3>
          <button 
            onClick={() => setShowBodyModal(true)} 
            className="bg-slate-100 dark:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 p-2 touch-target rounded-full transition-colors text-slate-600 dark:text-slate-300"
            data-testid="button-add-body-log"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex gap-6 sm:gap-8 mb-3 sm:mb-4 relative z-10">
          <div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mb-1">Вес</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight" data-testid="text-weight">
              {user.weight} <span className="text-base sm:text-lg text-slate-400 dark:text-slate-500 font-normal">кг</span>
            </div>
          </div>
          {user.fat && (
            <div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mb-1">Жир</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight" data-testid="text-fat">
                {user.fat} <span className="text-base sm:text-lg text-slate-400 dark:text-slate-500 font-normal">%</span>
              </div>
            </div>
          )}
        </div>
        <div className="h-[120px] sm:h-[150px] w-full relative z-0 -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bodyChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis yAxisId="weight" hide domain={['dataMin - 2', 'dataMax + 2']} />
              <YAxis yAxisId="fat" orientation="right" hide domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Area 
                yAxisId="weight" 
                type="monotone" 
                dataKey="weight" 
                name="Вес" 
                unit=" кг" 
                stroke="#7C3AED" 
                strokeWidth={3} 
                fill="url(#colorWeight)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#7C3AED' }} 
              />
              {hasFatData && (
                <Area 
                  yAxisId="fat" 
                  type="monotone" 
                  dataKey="fat" 
                  name="Жир" 
                  unit=" %" 
                  stroke="#F59E0B" 
                  strokeWidth={3} 
                  strokeDasharray="4 4" 
                  fill="url(#colorFat)" 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <button 
        onClick={onLogClick} 
        className="w-full py-3.5 sm:py-4 touch-target bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        data-testid="button-log-workout"
      >
        <Plus size={20}/> Записать тренировку
      </button>
      {showBodyModal && (
        <BodyStatsManager 
          currentWeight={user.weight} 
          currentFat={user.fat} 
          logs={bodyLogs} 
          onClose={() => setShowBodyModal(false)} 
          onSave={onUpdateBody} 
          onDelete={onDeleteBodyLog} 
        />
      )}
      {selectedMuscle && (
        <MuscleDetailModal 
          muscle={selectedMuscle} 
          workouts={filteredWorkouts} 
          stats={stats} 
          onClose={() => setSelectedMuscle(null)} 
          user={user} 
        />
      )}
      {showStories && (
        <WeeklyStories 
          workouts={workouts} 
          onClose={() => setShowStories(false)} 
        />
      )}
    </div>
  );
}
