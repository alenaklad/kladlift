import { useState, useMemo } from 'react';
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
  Plus, 
  Scale, 
  Activity 
} from 'lucide-react';
import { 
  GOALS, 
  MUSCLE_GROUPS, 
  type UserProfile, 
  type Workout, 
  type BodyLog 
} from '@shared/schema';
import { 
  calculateFullProgram, 
  getRangeFilter, 
  getCyclePhaseForDate 
} from '@/lib/training';
import { BodyStatsManager } from './BodyStatsManager';
import { MuscleDetailModal } from './MuscleDetailModal';

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
  onOpenCycle
}: DashboardProps) {
  const [timeRange, setTimeRange] = useState('this_week');
  const [showBodyModal, setShowBodyModal] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const program = useMemo(() => 
    calculateFullProgram({ ...user, gender: user.gender }), 
    [user]
  );

  const filteredWorkouts = useMemo(() => {
    const { start, end } = getRangeFilter(timeRange);
    return workouts.filter(w => w.date >= start && w.date <= end);
  }, [workouts, timeRange]);

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
    return { actualVolume };
  }, [filteredWorkouts]);

  const cyclePhase = useMemo(() => 
    user.gender === 'female' && user.cycle 
      ? getCyclePhaseForDate(Date.now(), user.cycle.lastPeriod, user.cycle.length) 
      : null, 
    [user]
  );

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

  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto space-y-6 animate-fadeIn bg-slate-50 min-h-screen">
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="text-app-title">KladLift</h1>
          <p className="text-slate-500 text-sm font-medium">Твоя система</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onOpenHistory} 
            className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors shadow-sm"
            data-testid="button-history"
          >
            <Clock size={20} />
          </button>
          <div 
            className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full flex items-center justify-center font-bold shadow-md"
            data-testid="text-user-avatar"
          >
            {user.gender === 'male' ? 'M' : 'Ж'}
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 text-purple-200 text-xs font-bold uppercase tracking-wider">
            <Target size={14}/> Цель
          </div>
          <h2 className="text-2xl font-bold mb-1 text-white" data-testid="text-goal">
            {GOALS[user.goal]?.label}
          </h2>
          <p className="text-purple-200 text-sm mb-4">
            {program.trainingParams.goalDescription}
          </p>
          <div className="flex gap-6">
            <div>
              <div className="text-2xl font-bold text-white" data-testid="text-base-sets">
                {program.meta.standardSets}
              </div>
              <div className="text-[10px] text-purple-200 uppercase">База (сеты)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400" data-testid="text-recovery-factor">
                x{program.meta.recoveryMultiplier.toFixed(2)}
              </div>
              <div className="text-[10px] text-purple-200 uppercase">Фактор восст.</div>
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

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-900">Недельный объем</h3>
          <div className="flex gap-1">
            <button 
              onClick={() => setTimeRange('this_week')} 
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                timeRange === 'this_week' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              data-testid="button-this-week"
            >
              Тек. неделя
            </button>
            <button 
              onClick={() => setTimeRange('last_week')} 
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                timeRange === 'last_week' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              data-testid="button-last-week"
            >
              Пред. неделя
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {(Object.keys(MUSCLE_GROUPS) as Array<keyof typeof MUSCLE_GROUPS>).map(key => {
            if (key === 'cardio') return null;
            const actual = stats.actualVolume[key] || 0;
            const target = program.weeklyVolume[key] || 10;
            const pct = Math.min((actual / target) * 100, 120);
            let barColor = '#22C55E';
            if (actual < target * 0.5) barColor = '#F59E0B';
            if (actual > target * 1.1) barColor = '#EF4444';
            
            return (
              <div 
                key={key} 
                onClick={() => setSelectedMuscle(key)} 
                className="cursor-pointer group"
                data-testid={`muscle-progress-${key}`}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium flex items-center gap-1 text-slate-700">
                    {MUSCLE_GROUPS[key].label} 
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400"/>
                  </span>
                  <span className="text-slate-500 font-mono">{actual} / {target}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${(pct / 120) * 100}%`, backgroundColor: barColor }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-start mb-2 relative z-10">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
            <Scale className="w-5 h-5 text-slate-400" /> Тело
          </h3>
          <button 
            onClick={() => setShowBodyModal(true)} 
            className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors text-slate-600"
            data-testid="button-add-body-log"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex gap-8 mb-4 relative z-10">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Вес</div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight" data-testid="text-weight">
              {user.weight} <span className="text-lg text-slate-400 font-normal">кг</span>
            </div>
          </div>
          {user.fat && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Жир</div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight" data-testid="text-fat">
                {user.fat} <span className="text-lg text-slate-400 font-normal">%</span>
              </div>
            </div>
          )}
        </div>
        <div className="h-[150px] w-full relative z-0 -ml-4">
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
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/25 active:scale-95 transition-transform flex items-center justify-center gap-2 hover:from-purple-700 hover:to-purple-800"
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
    </div>
  );
}
