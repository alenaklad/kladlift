import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceArea 
} from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { 
  MUSCLE_GROUPS, 
  type Workout, 
  type CycleData,
  type MuscleGroup,
  type SelectCustomExercise,
  type SelectUserExercise,
  type Exercise as ExerciseType
} from '@shared/schema';
import { 
  getRangeFilter, 
  formatDate,
  getCyclePhaseForDate 
} from '@/lib/training';
import { FULL_EXERCISE_DB } from '@/lib/exercises';

interface ProgressProps {
  workouts: Workout[];
  userCycle?: CycleData;
}

export function Progress({ workouts, userCycle }: ProgressProps) {
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup>('legs');
  const [timeRange, setTimeRange] = useState('month');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  // Fetch exercises from database
  const { data: dbExercises = [] } = useQuery<SelectCustomExercise[]>({
    queryKey: ['/api/exercises']
  });

  const { data: userExercises = [] } = useQuery<SelectUserExercise[]>({
    queryKey: ['/api/user-exercises']
  });

  // Combine all exercises into a lookup map, with static fallback
  const exerciseLookup = useMemo(() => {
    const map = new Map<string, ExerciseType>();
    
    // First, populate from static database as fallback
    FULL_EXERCISE_DB.forEach(ex => {
      map.set(ex.id, ex);
    });
    
    // Override/add from API data if available
    dbExercises.forEach(ex => {
      map.set(ex.id, {
        id: ex.id,
        name: ex.name,
        muscle: ex.muscle as MuscleGroup,
        type: ex.type as 'compound' | 'isolation',
        technique: ex.technique
      });
    });
    userExercises.forEach(ex => {
      map.set(ex.id, {
        id: ex.id,
        name: ex.name,
        muscle: ex.muscle as MuscleGroup,
        type: ex.type as 'compound' | 'isolation',
        technique: ex.technique
      });
    });
    return map;
  }, [dbExercises, userExercises]);

  const availableExercises = useMemo(() => {
    const set = new Set<string>();
    workouts.forEach(w => 
      w.exercises.forEach(ex => {
        if (ex.muscle === selectedGroup) set.add(ex.id);
      })
    );
    return Array.from(set)
      .map(id => exerciseLookup.get(id))
      .filter(Boolean) as ExerciseType[];
  }, [workouts, selectedGroup, exerciseLookup]);

  useEffect(() => {
    if (availableExercises.length > 0 && !selectedExerciseId) {
      setSelectedExerciseId(availableExercises[0]?.id || null);
    }
  }, [availableExercises, selectedGroup]);

  const chartData = useMemo(() => {
    if (!selectedExerciseId) return [];
    const { start, end } = getRangeFilter(timeRange);
    const filteredWorkouts = workouts.filter(w => w.date >= start && w.date <= end);

    return filteredWorkouts.map(w => {
      const exData = w.exercises.find(e => e.id === selectedExerciseId);
      if (!exData) return null;
      const maxWeight = exData.sets.length > 0 
        ? Math.max(...exData.sets.map(s => s.weight)) 
        : 0;
      const phase = userCycle 
        ? getCyclePhaseForDate(w.date, userCycle.lastPeriod, userCycle.length) 
        : null;
      return {
        date: w.date,
        displayDate: formatDate(w.date),
        weight: maxWeight,
        phaseColor: phase ? phase.color : '#e5e7eb',
        phaseName: phase ? phase.name : ''
      };
    }).filter(Boolean).sort((a, b) => (a?.date || 0) - (b?.date || 0));
  }, [workouts, selectedExerciseId, timeRange, userCycle]);

  const statsChange = useMemo(() => {
    if (chartData.length < 2) return null;
    const start = chartData[0]?.weight || 0;
    const current = chartData[chartData.length - 1]?.weight || 0;
    const diff = current - start;
    if (start === 0) return { diff, text: `+ ${diff} кг`, isPositive: true };
    const percentage = ((diff / start) * 100).toFixed(1);
    return { diff, percentage, text: `${percentage}%`, isPositive: diff >= 0 };
  }, [chartData]);

  const renderPhaseBackgrounds = () => {
    if (!chartData.length || !userCycle) return null;
    return chartData.map((entry, index) => (
      <ReferenceArea 
        key={index} 
        x1={entry?.displayDate} 
        x2={entry?.displayDate} 
        y1={0} 
        y2="max" 
        strokeOpacity={0} 
        fill={entry?.phaseColor} 
        fillOpacity={0.15} 
      />
    ));
  };

  const timeRanges = [
    { id: 'this_week', label: 'Эта неделя' },
    { id: 'last_week', label: 'Прошлая нед.' },
    { id: 'last_2_weeks', label: '14 дней' },
    { id: 'month', label: 'Месяц' },
    { id: '3_months', label: '3 мес.' },
    { id: '6_months', label: 'Полгода' },
    { id: 'year', label: 'Год' },
    { id: 'all', label: 'Всё время' }
  ];

  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto animate-fadeIn bg-[#0A0E1A] min-h-screen text-white">
      <div className="flex justify-between items-end mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Прогресс</h1>
      </div>

      <div className="flex overflow-x-auto gap-3 pb-4 mb-6 scrollbar-hide">
        {(Object.keys(MUSCLE_GROUPS) as MuscleGroup[]).map(key => (
          <button 
            key={key} 
            onClick={() => {
              setSelectedGroup(key);
              setSelectedExerciseId(null);
            }}
            className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
              selectedGroup === key 
                ? 'bg-white text-[#0A0E1A] shadow-md' 
                : 'bg-[#1A1F2E] text-gray-400 border border-white/5 hover:border-white/20'
            }`}
            data-testid={`button-muscle-${key}`}
          >
            {MUSCLE_GROUPS[key].label}
          </button>
        ))}
      </div>

      {availableExercises.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            {availableExercises.map(ex => ex && (
              <button 
                key={ex.id} 
                onClick={() => setSelectedExerciseId(ex.id)} 
                className={`w-full text-left p-4 rounded-2xl transition-all flex justify-between items-center ${
                  selectedExerciseId === ex.id 
                    ? 'bg-[#1A1F2E] border-2 border-white/30 shadow-sm' 
                    : 'bg-[#111827] border border-white/5 hover:border-white/20'
                }`}
                data-testid={`button-exercise-${ex.id}`}
              >
                <span className="font-medium text-gray-200 truncate">{ex.name}</span>
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: MUSCLE_GROUPS[ex.muscle]?.color }}
                ></span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 bg-[#111827] p-6 rounded-3xl border border-white/5 shadow-sm h-[450px] flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-white">
                  {(selectedExerciseId && exerciseLookup.get(selectedExerciseId)?.name) || 'Выберите упражнение'}
                </h3>
                {statsChange && (
                  <div className={`flex items-center gap-1 text-sm mt-1 ${
                    statsChange.isPositive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {statsChange.isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="font-bold">{statsChange.text}</span>
                    <span className="text-gray-500 ml-1">за период</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex overflow-x-auto gap-2 mb-4 pb-2 scrollbar-hide">
              {timeRanges.map(range => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    timeRange === range.id 
                      ? 'bg-white text-[#0A0E1A]' 
                      : 'bg-[#1A1F2E] text-gray-400 hover:bg-[#252A3A]'
                  }`}
                  data-testid={`button-range-${range.id}`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <div className="flex-1 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    {userCycle && renderPhaseBackgrounds()}
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fontSize: 11, fill: '#6B7280' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#6B7280' }} 
                      axisLine={false} 
                      tickLine={false} 
                      domain={['dataMin - 5', 'dataMax + 5']} 
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                        padding: '12px 16px',
                        backgroundColor: '#1A1F2E',
                        color: '#fff'
                      }} 
                      formatter={(value: number) => [`${value} кг`, 'Макс. вес']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#ffffff" 
                      strokeWidth={3} 
                      fill="url(#colorProgress)" 
                      activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Нет данных за выбранный период</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#111827] p-12 rounded-3xl border border-white/5 text-center">
          <div className="text-gray-500 mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#1A1F2E] rounded-full flex items-center justify-center">
              <ArrowUp size={32} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-300 mb-2">Нет данных</h3>
            <p className="text-gray-500">
              Запишите тренировки для {MUSCLE_GROUPS[selectedGroup].label.toLowerCase()}, 
              чтобы увидеть прогресс
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
