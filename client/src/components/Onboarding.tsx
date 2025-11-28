import { useState } from 'react';
import { 
  ChevronLeft, 
  Check, 
  ArrowRight, 
  Activity, 
  Brain, 
  Zap 
} from 'lucide-react';
import { 
  GOALS, 
  STRESS_LEVELS, 
  MUSCLE_GROUPS,
  type UserProfile,
  type CycleData
} from '@shared/schema';
import { getIsoDateString } from '@/lib/training';

interface OnboardingProps {
  onComplete: (userData: UserProfile, shouldLogInitial: boolean) => void;
}

interface SelectCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
}

function SelectCard({ selected, onClick, title, desc }: SelectCardProps) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full text-left p-6 rounded-3xl border transition-all duration-300 group relative overflow-hidden ${
        selected 
          ? 'bg-white text-black border-white shadow-2xl scale-[1.02]' 
          : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
      data-testid={`select-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="text-lg font-bold mb-1">{title}</div>
          {desc && (
            <div className={`text-sm leading-relaxed ${selected ? 'text-gray-500' : 'text-gray-400'}`}>
              {desc}
            </div>
          )}
        </div>
        {selected && (
          <div className="bg-black text-white p-1 rounded-full">
            <Check size={16} />
          </div>
        )}
      </div>
    </button>
  );
}

interface DarkInputProps {
  label?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  style?: React.CSSProperties;
}

function DarkInput({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  placeholder, 
  className = "", 
  autoFocus = false,
  style = {}
}: DarkInputProps) {
  return (
    <div className={`w-full group ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-3 ml-1 group-focus-within:text-white/80 transition-colors">
          {label}
        </label>
      )}
      <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        autoFocus={autoFocus} 
        style={style}
        className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-white text-2xl placeholder-white/20 focus:ring-2 focus:ring-white/30 focus:bg-white/10 focus:border-transparent transition-all outline-none" 
        data-testid={`input-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`}
      />
    </div>
  );
}

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'primaryDark';
  className?: string;
  children: React.ReactNode;
}

function Button({ onClick, disabled = false, variant = 'primary', className = '', children }: ButtonProps) {
  const baseStyle = 'font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-white text-black hover:bg-gray-100 py-4 px-6',
    primaryDark: 'bg-black text-white hover:bg-gray-900 py-4 px-6',
    ghost: 'bg-transparent text-white/60 hover:text-white hover:bg-white/10 py-4 px-6'
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      data-testid="button-action"
    >
      {children}
    </button>
  );
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [data, setData] = useState({
    gender: null as 'male' | 'female' | null,
    age: '',
    height: '',
    weight: '',
    fat: '',
    experienceYears: '',
    experienceMonths: 0,
    sleep: 7.5,
    stress: 'moderate' as 'low' | 'moderate' | 'high',
    calories: 'maintenance' as 'surplus' | 'maintenance' | 'deficit',
    goal: 'hypertrophy' as 'hypertrophy' | 'strength' | 'endurance',
    trainingDays: 3,
    priorityMuscles: [] as string[]
  });
  const [cycleData, setCycleData] = useState<CycleData>({
    lastPeriod: getIsoDateString(Date.now()),
    length: 28
  });

  const steps = [
    { id: 'landing', title: '', subtitle: '' },
    { id: 'gender', title: 'Физиология', subtitle: 'Мы учитываем гормональные особенности для точного расчета восстановления.' },
    { id: 'age', title: 'Жизненный этап', subtitle: 'С возрастом метаболизм и способность к регенерации меняются. Мы адаптируемся.' },
    { id: 'biometrics', title: 'Биометрия', subtitle: 'Точка отсчета. Эти данные помогут рассчитать твои идеальные рабочие веса.' },
    { id: 'schedule', title: 'График', subtitle: 'Сколько дней в неделю ты готов посвятить себе? Мы построим микроцикл.' },
    { id: 'experience', title: 'Бэкграунд', subtitle: 'Сколько лет ты уже тренируешься? Это определит объем нагрузки.' },
    { id: 'sleep', title: 'Батарейка', subtitle: 'Сон — это легальный допинг. Сколько часов ты спишь в среднем?' },
    { id: 'stress', title: 'Нагрузка на ЦНС', subtitle: 'Стресс сжигает ресурсы организма так же, как тяжелая тренировка.' },
    { id: 'goal', title: 'Миссия', subtitle: 'К какой форме мы стремимся прямо сейчас?' },
    { id: 'priorities', title: 'Акценты', subtitle: 'Выбери до 2-х групп мышц, которые хочешь улучшить в первую очередь.' },
    { id: 'cycle', title: 'Синхронизация', subtitle: 'Тренируйся в ритме со своим телом для лучших результатов.' },
    { id: 'initial_check', title: 'Синхронизация', subtitle: 'Чтобы план был точным, алгоритму нужно знать контекст.' }
  ];

  const activeSteps = steps.filter(s => !(s.id === 'cycle' && data.gender === 'male'));
  const currentStepData = activeSteps[step];
  const progress = ((step) / (activeSteps.length - 1)) * 100;

  const nextStep = (skipAnimation = false) => {
    if (!skipAnimation) setIsAnimating(true);
    setTimeout(() => {
      if (step < activeSteps.length - 1) {
        setStep(s => s + 1);
      }
    }, skipAnimation ? 0 : 400);
    if (!skipAnimation) setTimeout(() => setIsAnimating(false), 400);
  };

  const handleInitialLogChoice = (choice: 'yes' | 'no') => {
    const finalData: UserProfile = {
      gender: data.gender!,
      age: parseFloat(data.age) || 25,
      height: parseFloat(data.height) || 170,
      weight: parseFloat(data.weight) || 70,
      fat: data.fat ? parseFloat(data.fat) : undefined,
      experienceYears: parseFloat(data.experienceYears || '0') + (data.experienceMonths / 12),
      sleep: data.sleep,
      stress: data.stress,
      calories: data.calories,
      goal: data.goal,
      trainingDays: data.trainingDays,
      priorityMuscles: data.priorityMuscles,
      cycle: data.gender === 'female' ? cycleData : undefined
    };

    onComplete(finalData, choice === 'yes');
  };

  const handleChange = <K extends keyof typeof data>(field: K, value: typeof data[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const togglePriority = (m: string) => {
    const current = data.priorityMuscles;
    if (current.includes(m)) {
      handleChange('priorityMuscles', current.filter(i => i !== m));
    } else if (current.length < 2) {
      handleChange('priorityMuscles', [...current, m]);
    }
  };

  const resetPriorities = () => {
    handleChange('priorityMuscles', []);
    nextStep();
  };

  const canProceed = (): boolean => {
    switch (currentStepData?.id) {
      case 'landing': return true;
      case 'gender': return data.gender !== null;
      case 'age': return parseFloat(data.age) > 10;
      case 'biometrics': return !!data.height && !!data.weight;
      case 'experience': return data.experienceYears !== '';
      case 'sleep': return true;
      case 'stress': return true;
      case 'goal': return true;
      case 'schedule': return true;
      case 'priorities': return true;
      case 'cycle': return !!cycleData.lastPeriod && cycleData.length > 0;
      case 'initial_check': return true;
      default: return false;
    }
  };

  const renderContent = () => {
    switch (currentStepData?.id) {
      case 'landing':
        return (
          <div className="flex flex-col items-center text-center space-y-10 pt-12 animate-fadeIn">
            <div className="relative">
              <div className="absolute -inset-4 bg-white/20 rounded-full blur-2xl opacity-50"></div>
              <div className="relative w-28 h-28 bg-white text-black rounded-full flex items-center justify-center shadow-2xl">
                <Activity size={48} strokeWidth={1.5} />
              </div>
            </div>
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tighter leading-tight">
                Биоинженерия <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-white">
                  твоего тела
                </span>
              </h1>
              <p className="text-lg text-gray-400 max-w-sm mx-auto leading-relaxed">
                Превращаем твои биологические данные в идеальную, научно обоснованную программу тренировок.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 w-full max-w-sm pt-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
                <Brain className="mb-2 text-gray-400" size={24}/>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">AI Тренер</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
                <Activity className="mb-2 text-gray-400" size={24}/>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Аналитика</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
                <Zap className="mb-2 text-gray-400" size={24}/>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Прогресс</span>
              </div>
            </div>
            <div className="w-full max-w-sm pt-4">
              <Button onClick={() => nextStep(false)} className="w-full py-6 text-xl bg-white text-black hover:bg-gray-200">
                Начать трансформацию <ArrowRight className="ml-2" size={20}/>
              </Button>
            </div>
          </div>
        );

      case 'gender':
        return (
          <div className="space-y-4 w-full max-w-sm">
            <SelectCard 
              title="Мужской" 
              desc="Алгоритм для мужской гормональной системы." 
              selected={data.gender === 'male'} 
              onClick={() => handleChange('gender', 'male')} 
            />
            <SelectCard 
              title="Женский" 
              desc="Учет менструального цикла и фаз восстановления." 
              selected={data.gender === 'female'} 
              onClick={() => handleChange('gender', 'female')} 
            />
          </div>
        );

      case 'age':
        return (
          <div className="w-full max-w-xs">
            <DarkInput 
              autoFocus 
              type="number" 
              label="Полных лет" 
              value={data.age} 
              onChange={e => handleChange('age', e.target.value)} 
              placeholder="25" 
              className="text-center" 
            />
          </div>
        );

      case 'biometrics':
        return (
          <div className="space-y-6 w-full max-w-sm">
            <DarkInput 
              autoFocus 
              type="number" 
              label="Рост (см)" 
              value={data.height} 
              onChange={e => handleChange('height', e.target.value)} 
              placeholder="175" 
            />
            <DarkInput 
              type="number" 
              label="Вес (кг)" 
              value={data.weight} 
              onChange={e => handleChange('weight', e.target.value)} 
              placeholder="70" 
            />
            <DarkInput 
              type="number" 
              label="Процент жира (Опционально)" 
              value={data.fat} 
              onChange={e => handleChange('fat', e.target.value)} 
              placeholder="15" 
            />
          </div>
        );

      case 'schedule':
        return (
          <div className="w-full max-w-sm space-y-8">
            <div className="text-center">
              <span className="text-6xl font-bold">{data.trainingDays}</span>
              <span className="text-xl text-gray-500 ml-2">дн/нед</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="7" 
              step="1" 
              value={data.trainingDays} 
              onChange={e => handleChange('trainingDays', parseInt(e.target.value))} 
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" 
              data-testid="slider-training-days"
            />
            <p className="text-center text-gray-400 text-sm">Оптимально: 3-4 дня</p>
          </div>
        );

      case 'experience':
        return (
          <div className="space-y-6 w-full max-w-sm">
            <div className="flex gap-4">
              <DarkInput 
                autoFocus 
                type="number" 
                label="Лет" 
                value={data.experienceYears} 
                onChange={e => handleChange('experienceYears', e.target.value)} 
                placeholder="0" 
              />
              <DarkInput 
                type="number" 
                label="Месяцев" 
                value={data.experienceMonths.toString()} 
                onChange={e => handleChange('experienceMonths', parseInt(e.target.value) || 0)} 
                placeholder="0" 
              />
            </div>
            <div className="text-sm text-gray-500 bg-white/5 p-4 rounded-2xl leading-relaxed">
              <p>• 0-1 год: Фундамент. Низкий объем.</p>
              <p>• 1-3 года: Прогрессия. Средний объем.</p>
              <p>• 3+ лет: Специализация. Высокий объем.</p>
            </div>
          </div>
        );

      case 'sleep':
        return (
          <div className="w-full max-w-sm space-y-8">
            <div className="text-center">
              <span className="text-6xl font-bold">{data.sleep}</span>
              <span className="text-xl text-gray-500 ml-2">часов</span>
            </div>
            <input 
              type="range" 
              min="4" 
              max="10" 
              step="0.5" 
              value={data.sleep} 
              onChange={e => handleChange('sleep', parseFloat(e.target.value))} 
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" 
              data-testid="slider-sleep"
            />
            <p className="text-center text-gray-400 text-sm">Двигай ползунок</p>
          </div>
        );

      case 'stress':
        return (
          <div className="space-y-4 w-full max-w-sm">
            {(Object.keys(STRESS_LEVELS) as Array<keyof typeof STRESS_LEVELS>).map(key => (
              <SelectCard 
                key={key} 
                title={STRESS_LEVELS[key].label} 
                desc={STRESS_LEVELS[key].desc} 
                selected={data.stress === key} 
                onClick={() => handleChange('stress', key)} 
              />
            ))}
          </div>
        );

      case 'goal':
        return (
          <div className="space-y-4 w-full max-w-sm">
            {(Object.keys(GOALS) as Array<keyof typeof GOALS>).map(key => (
              <SelectCard 
                key={key} 
                title={GOALS[key].label} 
                desc={GOALS[key].description} 
                selected={data.goal === key} 
                onClick={() => handleChange('goal', key)} 
              />
            ))}
          </div>
        );

      case 'priorities':
        return (
          <div className="w-full max-w-sm space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(MUSCLE_GROUPS) as Array<keyof typeof MUSCLE_GROUPS>)
                .filter(k => k !== 'cardio')
                .map(key => (
                  <button 
                    key={key} 
                    onClick={() => togglePriority(key)} 
                    className={`p-4 rounded-2xl border text-sm font-bold transition-all duration-300 ${
                      data.priorityMuscles.includes(key) 
                        ? 'bg-white text-black border-white shadow-lg scale-105' 
                        : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
                    }`}
                    data-testid={`button-priority-${key}`}
                  >
                    {MUSCLE_GROUPS[key].label}
                  </button>
                ))}
            </div>
            <button 
              onClick={resetPriorities} 
              className="w-full p-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors"
              data-testid="button-balanced-development"
            >
              Пропорциональное развитие всех групп
            </button>
          </div>
        );

      case 'cycle':
        return (
          <div className="space-y-6 w-full max-w-sm">
            <DarkInput 
              label="Начало месячных" 
              type="date" 
              value={cycleData.lastPeriod} 
              onChange={(e) => setCycleData({ ...cycleData, lastPeriod: e.target.value })} 
              style={{ colorScheme: 'dark' }} 
            />
            <DarkInput 
              label="Длина цикла" 
              type="number" 
              value={cycleData.length.toString()} 
              onChange={(e) => setCycleData({ ...cycleData, length: parseInt(e.target.value) || 28 })} 
            />
          </div>
        );

      case 'initial_check':
        return (
          <div className="w-full max-w-sm space-y-4">
            <div className="bg-white/10 p-6 rounded-3xl border border-white/10 mb-6">
              <p className="text-lg text-white leading-relaxed mb-2">
                Ты уже тренировался на этой неделе?
              </p>
              <p className="text-sm text-gray-400">
                Если да, запиши эти тренировки сейчас. Это поможет алгоритму скорректировать план.
              </p>
            </div>
            <Button 
              onClick={() => handleInitialLogChoice('yes')} 
              variant="primary" 
              className="w-full"
            >
              Да, записать тренировки
            </Button>
            <Button 
              onClick={() => handleInitialLogChoice('no')} 
              variant="ghost" 
              className="w-full"
            >
              Нет, начать с чистого листа
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      
      {step > 0 && currentStepData?.id !== 'processing' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          <div 
            className="h-full bg-white transition-all duration-700 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}
      
      <div className="flex-1 flex flex-col px-6 py-12 relative z-10 overflow-y-auto custom-scrollbar">
        {step > 0 && currentStepData?.id !== 'processing' && (
          <button 
            onClick={() => setStep(s => s - 1)} 
            className="absolute top-8 left-6 text-gray-500 hover:text-white transition-colors z-50"
            data-testid="button-back"
          >
            <ChevronLeft size={32} />
          </button>
        )}
        
        <div className="flex-1 flex flex-col justify-center items-center max-w-lg mx-auto w-full min-h-[500px]">
          <div className={`w-full flex flex-col items-center transition-all duration-500 ease-out transform ${
            isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}>
            {currentStepData?.id !== 'landing' && currentStepData?.id !== 'processing' && (
              <div className="text-center mb-10 space-y-3">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {currentStepData?.title}
                </h2>
                <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xs mx-auto">
                  {currentStepData?.subtitle}
                </p>
              </div>
            )}
            {renderContent()}
          </div>
        </div>
        
        {currentStepData?.id !== 'landing' && 
         currentStepData?.id !== 'processing' && 
         currentStepData?.id !== 'initial_check' && (
          <div className="mt-auto pt-8 flex justify-center pb-safe">
            <Button 
              onClick={() => nextStep()} 
              disabled={!canProceed()} 
              className="w-full max-w-sm py-5 text-xl"
            >
              Далее
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
