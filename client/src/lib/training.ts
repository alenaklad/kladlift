import { 
  GOALS, 
  STRESS_LEVELS, 
  CALORIES_OPTS, 
  type UserProfile, 
  type CalculatedProgram,
  type CyclePhase
} from "@shared/schema";

const muscleBiasFactors = {
  male: { legs: 1.0, back: 1.0, chest: 1.0, shoulders: 0.8, arms: 0.6, abs: 0.5 },
  female: { legs: 1.3, back: 0.9, chest: 0.5, shoulders: 0.7, arms: 0.5, abs: 0.6 }
};

function getBaseSetsPerMuscle(experienceYears: number): number {
  if (experienceYears < 1) return 10;
  if (experienceYears < 3) return 14;
  return 18;
}

function getRecoveryMultiplier(sleep: number, stress: string, calories: string, age: number): number {
  let mult = 1.0;
  if (sleep < 6) mult *= 0.8;
  else if (sleep >= 8) mult *= 1.1;
  mult *= (STRESS_LEVELS[stress as keyof typeof STRESS_LEVELS]?.val || 1.0);
  mult *= (CALORIES_OPTS[calories as keyof typeof CALORIES_OPTS]?.val || 1.0);
  if (age > 35) mult *= 0.95;
  if (age > 45) mult *= 0.90;
  if (age > 55) mult *= 0.85;
  return mult;
}

export function calculateFullProgram(userData: Partial<UserProfile>): CalculatedProgram {
  const {
    experienceYears = 0,
    sleep = 7,
    stress = 'moderate',
    calories = 'maintenance',
    age = 25,
    gender = 'male',
    goal = 'hypertrophy',
    priorityMuscles = [],
    trainingDays = 3
  } = userData;

  const standardSets = getBaseSetsPerMuscle(experienceYears);
  const recoveryMult = getRecoveryMultiplier(sleep, stress, calories, age);
  const goalMod = GOALS[goal as keyof typeof GOALS]?.volumeMod || 1.0;
  const adjustedBaseVolume = standardSets * recoveryMult * goalMod;
  const biasFactors = muscleBiasFactors[gender === 'female' ? 'female' : 'male'];

  const weeklyVolume: Record<string, number> = {};
  let totalSets = 0;

  for (const [muscle, factor] of Object.entries(biasFactors)) {
    let sets = Math.round(adjustedBaseVolume * factor);
    if (priorityMuscles.includes(muscle)) sets = Math.round(sets * 1.3);
    else if (priorityMuscles.length > 0) sets = Math.round(sets * 0.9);
    if (sets < 3) sets = 3;
    if (sets > 28) sets = 28;
    weeklyVolume[muscle] = sets;
    totalSets += sets;
  }

  const perDay: Record<string, string> = {};
  for (const [muscle, sets] of Object.entries(weeklyVolume)) {
    perDay[muscle] = (sets / trainingDays).toFixed(1);
  }

  return {
    weeklyVolume,
    perDay,
    trainingParams: {
      repRange: GOALS[goal as keyof typeof GOALS]?.repRange || '8-12',
      restMinutes: GOALS[goal as keyof typeof GOALS]?.restMinutes || '1.5-2',
      goalDescription: GOALS[goal as keyof typeof GOALS]?.description || ''
    },
    meta: { standardSets, recoveryMultiplier: recoveryMult, totalWeeklySets: totalSets }
  };
}

export function getIsoDateString(dateMs: number): string {
  return new Date(dateMs).toISOString().split('T')[0];
}

export function getStartOfDay(dateMs: number): number {
  const d = new Date(dateMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatDate(dateStr: string | number): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  return new Date(dateStr).toLocaleDateString('ru-RU', options).replace('.', '');
}

export function formatFullDate(dateStr: string | number): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function getRangeFilter(range: string): { start: number; end: number } {
  const now = new Date();
  const todayStart = getStartOfDay(now.getTime());
  const msInDay = 86400000;
  const endOfToday = now.getTime();
  const dayOfWeek = now.getDay();
  const diffToMon = (dayOfWeek + 6) % 7;
  const thisMonday = todayStart - (diffToMon * msInDay);

  switch (range) {
    case 'this_week':
      return { start: thisMonday, end: endOfToday };
    case 'last_week':
      const lastMonday = thisMonday - (7 * msInDay);
      const lastSunday = thisMonday - 1;
      return { start: lastMonday, end: lastSunday };
    case 'last_2_weeks':
      return { start: todayStart - (14 * msInDay), end: endOfToday };
    case 'month':
      return { start: todayStart - (30 * msInDay), end: endOfToday };
    case '3_months':
      return { start: todayStart - (90 * msInDay), end: endOfToday };
    case '6_months':
      return { start: todayStart - (180 * msInDay), end: endOfToday };
    case 'year':
      return { start: todayStart - (365 * msInDay), end: endOfToday };
    case 'all':
      return { start: 0, end: endOfToday };
    default:
      return { start: todayStart - (30 * msInDay), end: endOfToday };
  }
}

export function getCyclePhaseForDate(
  targetDateMs: number,
  lastPeriodDateStr: string,
  cycleLength: number = 28
): CyclePhase | null {
  if (!lastPeriodDateStr) return null;

  const targetDate = new Date(targetDateMs);
  const lastPeriod = new Date(lastPeriodDateStr);
  targetDate.setHours(0, 0, 0, 0);
  lastPeriod.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - lastPeriod.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  let currentDay = (diffDays % cycleLength);
  if (currentDay < 0) currentDay += cycleLength;
  currentDay += 1;

  const phases = {
    menstrual: {
      id: 'menstrual',
      name: 'Менструация',
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      desc: 'Низкая энергия. Восстановление.',
      rec: 'Йога, ходьба, легкая растяжка.',
      guidance: { sleep: 'Высокая потребность', strain: 'Низкая', stress: 'Минимизировать' }
    },
    follicular: {
      id: 'follicular',
      name: 'Фолликулярная',
      color: '#EC4899',
      bg: 'rgba(236, 72, 153, 0.1)',
      desc: 'Рост энергии. Сила возвращается.',
      rec: 'Силовые, кардио, обучение новому.',
      guidance: { sleep: 'Нормальная', strain: 'Высокая', stress: 'Умеренная' }
    },
    ovulation: {
      id: 'ovulation',
      name: 'Овуляция',
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)',
      desc: 'Пик силы и тестостерона.',
      rec: 'Максимальные веса, HIIT, рекорды.',
      guidance: { sleep: 'Нормальная', strain: 'Максимальная', stress: 'Высокая толерантность' }
    },
    luteal: {
      id: 'luteal',
      name: 'Лютеиновая',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
      desc: 'Спад энергии. Выносливость ниже.',
      rec: 'Умеренные веса, больше повторов, пилатес.',
      guidance: { sleep: 'Нужен качественный сон', strain: 'Средняя/Низкая', stress: 'Чувствительность повышена' }
    }
  };

  if (currentDay >= 1 && currentDay <= 5) return { ...phases.menstrual, day: currentDay };
  if (currentDay >= 6 && currentDay <= 13) return { ...phases.follicular, day: currentDay };
  if (currentDay >= 14 && currentDay <= 16) return { ...phases.ovulation, day: currentDay };
  return { ...phases.luteal, day: currentDay };
}
