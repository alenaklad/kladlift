import { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, Moon, Sun, Zap, Heart, Activity, Info, Plus, X } from 'lucide-react';
import type { UserProfile } from '@shared/schema';
import { getCyclePhaseForDate } from '@/lib/training';

interface CycleViewProps {
  user: UserProfile;
  onBack: () => void;
  onUpdatePeriod: (date: string) => void;
}

const PHASES_INFO = [
  {
    id: 'menstrual',
    name: 'Менструация',
    days: '1-5',
    color: '#EF4444',
    bgClass: 'from-red-500/20 to-red-600/10',
    borderClass: 'border-red-300',
    icon: Moon,
    description: 'Низкая энергия. Организм восстанавливается.',
    training: [
      'Легкая йога и растяжка',
      'Пешие прогулки',
      'Плавание с низкой интенсивностью',
      'Медитация и дыхательные практики'
    ],
    avoid: [
      'Интенсивные силовые тренировки',
      'HIIT и спринты',
      'Тяжелые базовые упражнения'
    ],
    nutrition: 'Увеличьте потребление железа (красное мясо, шпинат). Пейте больше воды.',
    sleep: 'Высокая потребность во сне. Ложитесь раньше.',
    mood: 'Возможны перепады настроения. Будьте к себе добры.'
  },
  {
    id: 'follicular',
    name: 'Фолликулярная',
    days: '6-13',
    color: '#EC4899',
    bgClass: 'from-pink-500/20 to-pink-600/10',
    borderClass: 'border-pink-300',
    icon: Sun,
    description: 'Рост энергии. Эстроген повышается, сила возвращается.',
    training: [
      'Силовые тренировки со средними весами',
      'Кардио с нарастающей интенсивностью',
      'Изучение новых упражнений',
      'Групповые тренировки'
    ],
    avoid: [
      'Перетренированность (энергия есть, но не переусердствуйте)'
    ],
    nutrition: 'Углеводы для энергии. Белок для восстановления мышц.',
    sleep: 'Нормальный режим сна. Можно тренироваться утром.',
    mood: 'Энергия и мотивация растут. Отличное время для новых целей!'
  },
  {
    id: 'ovulation',
    name: 'Овуляция',
    days: '14-16',
    color: '#8B5CF6',
    bgClass: 'from-purple-500/20 to-purple-600/10',
    borderClass: 'border-purple-300',
    icon: Zap,
    description: 'Пик силы и тестостерона. Максимальная производительность.',
    training: [
      'Максимальные веса и рекорды',
      'HIIT и интервальные тренировки',
      'Соревновательные тренировки',
      'Сложные комплексные упражнения'
    ],
    avoid: [
      'Пропуск тренировок (это ваш пик!)'
    ],
    nutrition: 'Полноценное питание. Больше белка для максимального результата.',
    sleep: 'Можете позволить себе более интенсивный режим.',
    mood: 'Максимальная уверенность и социальная активность.'
  },
  {
    id: 'luteal',
    name: 'Лютеиновая',
    days: '17-28',
    color: '#F59E0B',
    bgClass: 'from-amber-500/20 to-amber-600/10',
    borderClass: 'border-amber-300',
    icon: Heart,
    description: 'Спад энергии. Прогестерон повышается, выносливость снижается.',
    training: [
      'Умеренные веса, больше повторений',
      'Пилатес и низкоинтенсивная йога',
      'Легкое кардио (ходьба, велосипед)',
      'Фокус на технику, не на вес'
    ],
    avoid: [
      'Экстремальные нагрузки',
      'Долгие высокоинтенсивные тренировки',
      'Жёсткие диеты'
    ],
    nutrition: 'Возможен рост аппетита. Не ограничивайте себя жёстко. Магний и B6.',
    sleep: 'Качественный сон особенно важен. Избегайте кофеина вечером.',
    mood: 'Чувствительность повышена. ПМС. Больше отдыха и самозаботы.'
  }
];

export function CycleView({ user, onBack, onUpdatePeriod }: CycleViewProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const cyclePhase = useMemo(() => 
    user.gender === 'female' && user.cycle 
      ? getCyclePhaseForDate(Date.now(), user.cycle.lastPeriod, user.cycle.length) 
      : null, 
    [user]
  );

  const currentPhaseInfo = PHASES_INFO.find(p => p.id === cyclePhase?.id);

  const handleSavePeriod = () => {
    onUpdatePeriod(selectedDate);
    setShowDatePicker(false);
  };

  if (!user.cycle || user.gender !== 'female') {
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
          <Activity size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Цикл не настроен</h2>
          <p className="text-slate-500">Укажите дату последней менструации в настройках профиля.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div 
        className="relative p-6 pb-8"
        style={{ 
          background: `linear-gradient(135deg, ${cyclePhase?.color}15 0%, ${cyclePhase?.color}05 100%)`
        }}
      >
        <button 
          onClick={onBack}
          className="mb-6 p-3 bg-white/80 backdrop-blur-sm border border-white/50 rounded-full shadow-sm hover:bg-white transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${cyclePhase?.color}20` }}
          >
            {currentPhaseInfo?.icon && <currentPhaseInfo.icon size={24} style={{ color: cyclePhase?.color }} />}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">День цикла</p>
            <p className="text-3xl font-bold text-slate-900">{cyclePhase?.day}</p>
          </div>
        </div>

        <h1 
          className="text-2xl font-bold mb-2"
          style={{ color: cyclePhase?.color }}
          data-testid="text-phase-name"
        >
          {cyclePhase?.name}
        </h1>
        <p className="text-slate-600">{cyclePhase?.desc}</p>
      </div>

      <div className="p-6 space-y-6">
        {currentPhaseInfo && (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Zap size={18} style={{ color: cyclePhase?.color }} />
                Рекомендуемые тренировки
              </h3>
              <ul className="space-y-2">
                {currentPhaseInfo.training.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {currentPhaseInfo.avoid.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Info size={18} className="text-red-500" />
                  Лучше избегать
                </h3>
                <ul className="space-y-2">
                  {currentPhaseInfo.avoid.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-red-400 mt-0.5">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-2 text-sm">Питание</h4>
                <p className="text-sm text-slate-600">{currentPhaseInfo.nutrition}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-2 text-sm">Сон</h4>
                <p className="text-sm text-slate-600">{currentPhaseInfo.sleep}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-2 text-sm">Настроение</h4>
              <p className="text-sm text-slate-600">{currentPhaseInfo.mood}</p>
            </div>
          </>
        )}

        <div className="mt-8">
          <h3 className="font-bold text-slate-900 mb-4 text-lg">Все фазы цикла</h3>
          <div className="space-y-3">
            {PHASES_INFO.map((phase) => {
              const isActive = phase.id === cyclePhase?.id;
              const PhaseIcon = phase.icon;
              return (
                <div 
                  key={phase.id}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    isActive 
                      ? `bg-gradient-to-r ${phase.bgClass} ${phase.borderClass}` 
                      : 'bg-white border-slate-100 opacity-60'
                  }`}
                  data-testid={`phase-card-${phase.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: isActive ? `${phase.color}20` : '#f1f5f9' }}
                    >
                      <PhaseIcon size={20} style={{ color: isActive ? phase.color : '#94a3b8' }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{phase.name}</span>
                        <span className="text-xs text-slate-500">Дни {phase.days}</span>
                        {isActive && (
                          <span 
                            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: phase.color, color: 'white' }}
                          >
                            Сейчас
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{phase.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-100 p-4 rounded-2xl mt-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={16} />
            <span>Длина цикла: <strong>{user.cycle.length} дней</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
            <Activity size={16} />
            <span>Последняя менструация: <strong>{new Date(user.cycle.lastPeriod).toLocaleDateString('ru-RU')}</strong></span>
          </div>
        </div>

        <button
          onClick={() => setShowDatePicker(true)}
          className="w-full mt-6 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg"
          data-testid="button-start-period"
        >
          <Plus size={20} />
          Отметить начало месячных
        </button>
      </div>

      {showDatePicker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Начало цикла</h3>
              <button 
                onClick={() => setShowDatePicker(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                data-testid="button-close-period-modal"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Укажите дату, когда начались месячные. Это поможет точнее рассчитать фазы вашего цикла.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Дата начала
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-center text-slate-900 outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all"
                  data-testid="input-period-date"
                />
              </div>
              <button
                onClick={handleSavePeriod}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-bold hover:from-pink-600 hover:to-pink-700 transition-colors"
                data-testid="button-save-period"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
