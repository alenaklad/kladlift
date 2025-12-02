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
  getCardioType,
  type Workout, 
  type CycleData,
  type MuscleGroup,
  type SelectCustomExercise,
  type SelectUserExercise,
  type Exercise as ExerciseType,
  type CardioType
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

type CardioMetric = 'duration' | 'distance' | 'speed' | 'steps' | 'jumps';

export function Progress({ workouts, userCycle }: ProgressProps) {
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup>('legs');
  const [timeRange, setTimeRange] = useState('month');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [cardioMetric, setCardioMetric] = useState<CardioMetric>('duration');

  const selectedCardioType = selectedExerciseId ? getCardioType(selectedExerciseId) : null;
  const isCardio = selectedGroup === 'cardio';

  const { data: dbExercises = [] } = useQuery<SelectCustomExercise[]>({
    queryKey: ['/api/exercises']
  });

  const { data: userExercises = [] } = useQuery<SelectUserExercise[]>({
    queryKey: ['/api/user-exercises']
  });

  const exerciseLookup = useMemo(() => {
    const map = new Map<string, ExerciseType>();
    
    FULL_EXERCISE_DB.forEach(ex => {
      map.set(ex.id, ex);
    });
    
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

  const [displayUnit, setDisplayUnit] = useState<'km' | 'mi'>('km');

  const chartData = useMemo(() => {
    if (!selectedExerciseId) return [];
    const { start, end } = getRangeFilter(timeRange);
    const filteredWorkouts = workouts.filter(w => w.date >= start && w.date <= end);
    const cardioType = getCardioType(selectedExerciseId);

    const MI_TO_KM = 1.60934;
    const KM_TO_MI = 1 / MI_TO_KM;

    return filteredWorkouts.map(w => {
      const exData = w.exercises.find(e => e.id === selectedExerciseId);
      if (!exData) return null;
      
      const phase = userCycle 
        ? getCyclePhaseForDate(w.date, userCycle.lastPeriod, userCycle.length) 
        : null;

      if (cardioType) {
        const set = exData.sets[0] || {};
        const duration = set.duration || 0;
        const rawDistance = set.distance || 0;
        const originalUnit = set.distanceUnit || 'km';
        const steps = set.steps || 0;
        const jumps = set.jumps || 0;
        
        let normalizedDistance = rawDistance;
        if (displayUnit === 'km' && originalUnit === 'mi') {
          normalizedDistance = rawDistance * MI_TO_KM;
        } else if (displayUnit === 'mi' && originalUnit === 'km') {
          normalizedDistance = rawDistance * KM_TO_MI;
        }
        
        const speed = duration > 0 && normalizedDistance > 0 
          ? (normalizedDistance / (duration / 60)) 
          : 0;
        
        return {
          date: w.date,
          displayDate: formatDate(w.date),
          value: cardioMetric === 'duration' ? duration 
               : cardioMetric === 'distance' ? normalizedDistance 
               : cardioMetric === 'speed' ? speed 
               : cardioMetric === 'steps' ? steps 
               : cardioMetric === 'jumps' ? jumps : 0,
          duration,
          distance: normalizedDistance,
          speed,
          steps,
          jumps,
          distanceUnit: displayUnit,
          phaseColor: phase ? phase.color : '#e5e7eb',
          phaseName: phase ? phase.name : '',
          isCardio: true
        };
      }

      const maxWeightSet = exData.sets.reduce((max, s) => 
        (s.weight || 0) > (max.weight || 0) ? s : max, 
        exData.sets[0] || { weight: 0, reps: 0 }
      );
      const maxWeight = maxWeightSet.weight || 0;
      const maxWeightReps = maxWeightSet.reps || 0;
      return {
        date: w.date,
        displayDate: formatDate(w.date),
        value: maxWeight,
        weight: maxWeight,
        reps: maxWeightReps,
        phaseColor: phase ? phase.color : '#e5e7eb',
        phaseName: phase ? phase.name : '',
        isCardio: false
      };
    }).filter(Boolean).sort((a, b) => (a?.date || 0) - (b?.date || 0));
  }, [workouts, selectedExerciseId, timeRange, userCycle, cardioMetric, displayUnit]);

  const statsChange = useMemo(() => {
    if (chartData.length < 2) return null;
    const firstEntry = chartData[0];
    const lastEntry = chartData[chartData.length - 1];
    const start = firstEntry?.value || 0;
    const current = lastEntry?.value || 0;
    const diff = current - start;
    
    const getUnit = () => {
      if (!firstEntry?.isCardio) return 'кг';
      const unitLabel = displayUnit === 'km' ? 'км' : 'ми';
      switch (cardioMetric) {
        case 'duration': return 'мин';
        case 'distance': return unitLabel;
        case 'speed': return `${unitLabel}/ч`;
        case 'steps': return 'ступ.';
        case 'jumps': return 'прыж.';
        default: return '';
      }
    };
    
    if (start === 0) return { diff, text: `+ ${diff.toFixed(1)} ${getUnit()}`, isPositive: true };
    const percentage = ((diff / start) * 100).toFixed(1);
    return { diff, percentage, text: `${percentage}%`, isPositive: diff >= 0 };
  }, [chartData, cardioMetric, displayUnit]);

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
    <div className="p-6 pb-24 max-w-4xl mx-auto animate-fadeIn bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Прогресс</h1>
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
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
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
                    ? 'bg-white border-2 border-purple-500 shadow-md' 
                    : 'bg-white border border-slate-200 hover:border-slate-300'
                }`}
                data-testid={`button-exercise-${ex.id}`}
              >
                <span className="font-medium text-slate-700 truncate">{ex.name}</span>
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: MUSCLE_GROUPS[ex.muscle]?.color }}
                ></span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[450px] flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {(selectedExerciseId && exerciseLookup.get(selectedExerciseId)?.name) || 'Выберите упражнение'}
                </h3>
                {statsChange && (
                  <div className={`flex items-center gap-1 text-sm mt-1 ${
                    statsChange.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {statsChange.isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="font-bold">{statsChange.text}</span>
                    <span className="text-slate-500 ml-1">за период</span>
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
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                  data-testid={`button-range-${range.id}`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {selectedCardioType && (
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                  <button
                    onClick={() => setCardioMetric('duration')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      cardioMetric === 'duration' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                    }`}
                    data-testid="button-metric-duration"
                  >
                    Время
                  </button>
                  {selectedCardioType === 'distance' && (
                    <>
                      <button
                        onClick={() => setCardioMetric('distance')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                          cardioMetric === 'distance' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                        }`}
                        data-testid="button-metric-distance"
                      >
                        Дистанция
                      </button>
                      <button
                        onClick={() => setCardioMetric('speed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                          cardioMetric === 'speed' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                        }`}
                        data-testid="button-metric-speed"
                      >
                        Скорость
                      </button>
                    </>
                  )}
                  {selectedCardioType === 'stepper' && (
                    <button
                      onClick={() => setCardioMetric('steps')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        cardioMetric === 'steps' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                      }`}
                      data-testid="button-metric-steps"
                    >
                      Ступеньки
                    </button>
                  )}
                  {selectedCardioType === 'jumprope' && (
                    <button
                      onClick={() => setCardioMetric('jumps')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        cardioMetric === 'jumps' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                      }`}
                      data-testid="button-metric-jumps"
                    >
                      Прыжки
                    </button>
                  )}
                </div>
                {selectedCardioType === 'distance' && (cardioMetric === 'distance' || cardioMetric === 'speed') && (
                  <div className="flex gap-1 ml-auto">
                    <button
                      onClick={() => setDisplayUnit('km')}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                        displayUnit === 'km' 
                          ? 'bg-slate-700 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      data-testid="button-display-km"
                    >
                      км
                    </button>
                    <button
                      onClick={() => setDisplayUnit('mi')}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                        displayUnit === 'mi' 
                          ? 'bg-slate-700 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      data-testid="button-display-mi"
                    >
                      ми
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
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
                        border: '1px solid #E2E8F0', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        padding: '12px 16px',
                        backgroundColor: '#fff',
                        color: '#1E293B'
                      }} 
                      formatter={(value: number, name: string, props: any) => {
                        const entry = props.payload;
                        if (entry?.isCardio) {
                          const labels: Record<CardioMetric, string> = {
                            duration: 'Время',
                            distance: 'Дистанция',
                            speed: 'Скорость',
                            steps: 'Ступеньки',
                            jumps: 'Прыжки'
                          };
                          const unitLabel = displayUnit === 'km' ? 'км' : 'ми';
                          const units: Record<CardioMetric, string> = {
                            duration: 'мин',
                            distance: unitLabel,
                            speed: `${unitLabel}/ч`,
                            steps: '',
                            jumps: ''
                          };
                          return [`${value.toFixed(1)} ${units[cardioMetric]}`, labels[cardioMetric]];
                        }
                        const reps = entry?.reps || 0;
                        return [`${value} кг, ${reps} повторений`, 'Макс. вес'];
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#7C3AED" 
                      strokeWidth={3} 
                      fill="url(#colorProgress)" 
                      activeDot={{ r: 8, strokeWidth: 0, fill: '#7C3AED' }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <p>Нет данных за выбранный период</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
          <div className="text-slate-500 mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <ArrowUp size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Нет данных</h3>
            <p className="text-slate-500">
              Запишите тренировки для {MUSCLE_GROUPS[selectedGroup].label.toLowerCase()}, 
              чтобы увидеть прогресс
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
