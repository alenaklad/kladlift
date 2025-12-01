import { ArrowLeft, Target, Zap, Clock, Dumbbell, Moon, Utensils, Info } from 'lucide-react';
import type { UserProfile } from '@shared/schema';
import { GOALS, MUSCLE_GROUPS } from '@shared/schema';
import { calculateFullProgram } from '@/lib/training';
import { useMemo } from 'react';

interface GoalDetailsViewProps {
  user: UserProfile;
  onBack: () => void;
}

const GOAL_DETAILS = {
  hypertrophy: {
    title: 'Эстетика и гипертрофия',
    subtitle: 'Максимальный мышечный объем и пропорции',
    color: '#7C3AED',
    description: 'Гипертрофия — это процесс увеличения размера мышечных волокон. Для достижения максимального роста мышц необходимо создать механическое напряжение, метаболический стресс и повреждение мышц.',
    principles: [
      'Умеренные веса (65-80% от 1ПМ)',
      '8-12 повторений в подходе',
      'Отдых 60-120 секунд между подходами',
      'Контролируемый темп выполнения',
      'Акцент на связь "мозг-мышца"'
    ],
    recovery: [
      'Сон 7-9 часов для оптимального восстановления',
      'Белок 1.6-2.2 г на кг веса тела',
      'Углеводы для восполнения гликогена',
      '48-72 часа отдыха между тренировками одной группы',
      'Дефицит сна снижает синтез белка на 20%'
    ],
    volumeExplanation: 'При гипертрофии рекомендуется умеренный объём (10-20 подходов на группу в неделю) для создания достаточного стимула без перетренированности.'
  },
  strength: {
    title: 'Абсолютная сила',
    subtitle: 'Подъем максимальных весов и нейральная эффективность',
    color: '#EF4444',
    description: 'Силовые тренировки направлены на развитие максимальной мощности через адаптацию нервной системы и увеличение плотности миофибрилл. Основа — работа с тяжёлыми весами.',
    principles: [
      'Тяжёлые веса (85-95% от 1ПМ)',
      '3-5 повторений в подходе',
      'Длинный отдых 3-5 минут',
      'Акцент на базовые упражнения',
      'Взрывное выполнение концентрической фазы'
    ],
    recovery: [
      'Полное восстановление ЦНС (48-96 часов)',
      'Качественный сон минимум 8 часов',
      'Достаточное питание для энергии',
      'Избегать тренировок в состоянии усталости',
      'Периодизация нагрузок обязательна'
    ],
    volumeExplanation: 'При силовых тренировках объём ниже (6-12 подходов), но интенсивность выше. ЦНС требует больше времени на восстановление.'
  },
  endurance: {
    title: 'Выносливость и рельеф',
    subtitle: 'Функциональность, тонус и похудение',
    color: '#10B981',
    description: 'Тренировки на выносливость улучшают митохондриальную плотность, капилляризацию мышц и способность организма использовать жир как топливо. Отлично подходит для сжигания калорий.',
    principles: [
      'Лёгкие и средние веса (40-65% от 1ПМ)',
      '15-20+ повторений в подходе',
      'Минимальный отдых 30-60 секунд',
      'Суперсеты и круговые тренировки',
      'Высокий темп выполнения'
    ],
    recovery: [
      'Быстрое восстановление (24-48 часов)',
      'Достаточная гидратация',
      'Углеводы для поддержания энергии',
      'Можно тренироваться чаще',
      'Следите за признаками перетренированности'
    ],
    volumeExplanation: 'Объём выше (15-25 подходов) из-за меньшей нагрузки на ЦНС. Мышцы восстанавливаются быстрее от лёгких весов.'
  }
};

export function GoalDetailsView({ user, onBack }: GoalDetailsViewProps) {
  const program = useMemo(() => calculateFullProgram(user), [user]);
  const goalInfo = GOAL_DETAILS[user.goal as keyof typeof GOAL_DETAILS];
  const goalData = GOALS[user.goal];

  if (!goalInfo) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <button 
          onClick={onBack}
          className="mb-6 p-3 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-100 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="text-center py-12">
          <Target size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Цель не найдена</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div 
        className="relative p-6 pb-8"
        style={{ 
          background: `linear-gradient(135deg, ${goalInfo.color}15 0%, ${goalInfo.color}05 100%)`
        }}
      >
        <button 
          onClick={onBack}
          className="mb-6 p-3 bg-white/80 backdrop-blur-sm border border-white/50 rounded-full shadow-sm hover:bg-white transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${goalInfo.color}20` }}
          >
            <Target size={28} style={{ color: goalInfo.color }} />
          </div>
          <div>
            <h1 
              className="text-2xl font-bold"
              style={{ color: goalInfo.color }}
              data-testid="text-goal-title"
            >
              {goalInfo.title}
            </h1>
            <p className="text-slate-600 text-sm">{goalInfo.subtitle}</p>
          </div>
        </div>

        <p className="text-slate-700 leading-relaxed">{goalInfo.description}</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
            <Dumbbell size={24} className="mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{goalData?.repRange}</div>
            <div className="text-xs text-slate-500 uppercase">Повторений</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
            <Clock size={24} className="mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{goalData?.restMinutes}</div>
            <div className="text-xs text-slate-500 uppercase">Минут отдыха</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
            <Zap size={24} className="mx-auto text-amber-600 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{program.meta.standardSets}</div>
            <div className="text-xs text-slate-500 uppercase">База (сеты)</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Target size={18} style={{ color: goalInfo.color }} />
            Принципы тренировок
          </h3>
          <ul className="space-y-2">
            {goalInfo.principles.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-green-500 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Moon size={18} className="text-indigo-500" />
            Восстановление
          </h3>
          <ul className="space-y-2">
            {goalInfo.recovery.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-indigo-400 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100">
          <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Info size={18} className="text-purple-600" />
            Почему именно такой объём?
          </h3>
          <p className="text-sm text-slate-600 mb-4">{goalInfo.volumeExplanation}</p>
          
          <div className="bg-white/80 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Ваши рекомендованные сеты в неделю
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.keys(MUSCLE_GROUPS) as Array<keyof typeof MUSCLE_GROUPS>).map(muscle => {
                if (muscle === 'cardio') return null;
                const sets = program.weeklyVolume[muscle] || 0;
                const group = MUSCLE_GROUPS[muscle];
                return (
                  <div 
                    key={muscle} 
                    className="flex items-center gap-2 p-2 rounded-lg"
                    style={{ backgroundColor: `${group.color}10` }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: group.color }}
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-slate-600">{group.label}</div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: group.color }}>
                      {sets}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Zap size={18} className="text-amber-500" />
            Ваш фактор восстановления
          </h3>
          <div className="flex items-center gap-4">
            <div 
              className="text-4xl font-bold"
              style={{ color: program.meta.recoveryMultiplier >= 1 ? '#10B981' : '#F59E0B' }}
            >
              x{program.meta.recoveryMultiplier.toFixed(2)}
            </div>
            <div className="flex-1 text-sm text-slate-600">
              {program.meta.recoveryMultiplier >= 1.05 
                ? 'Отличное восстановление! Вы можете тренироваться с повышенным объёмом.'
                : program.meta.recoveryMultiplier >= 0.95
                  ? 'Нормальное восстановление. Придерживайтесь стандартного объёма.'
                  : 'Сниженное восстановление. Рекомендуем уменьшить объём и больше отдыхать.'
              }
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            Фактор рассчитан на основе: сна ({user.sleep} ч), стресса, питания и возраста ({user.age} лет)
          </div>
        </div>
      </div>
    </div>
  );
}
