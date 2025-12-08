import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Flame, Dumbbell, Target, TrendingUp, Calendar, Clock } from 'lucide-react';
import type { Workout, MuscleGroup } from '@shared/schema';
import { MUSCLE_GROUPS } from '@shared/schema';

interface WeeklyStoriesProps {
  workouts: Workout[];
  onClose: () => void;
}

function isStoryTimeActive(): boolean {
  const now = new Date();
  const moscowFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Moscow',
    weekday: 'short',
    hour: 'numeric',
    hour12: false
  });
  
  const parts = moscowFormatter.formatToParts(now);
  const weekday = parts.find(p => p.type === 'weekday')?.value;
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  
  if (weekday === 'Sun' && hour >= 12) return true;
  if (weekday === 'Mon' && hour < 12) return true;
  return false;
}

function getLastWeekWorkouts(workouts: Workout[]): Workout[] {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  return workouts.filter(w => w.date >= sevenDaysAgo && w.date <= now);
}

function getMuscleStats(workouts: Workout[]): Record<MuscleGroup, { sets: number; exercises: number }> {
  const stats: Record<string, { sets: number; exercises: number }> = {};
  
  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      if (!stats[ex.muscle]) {
        stats[ex.muscle] = { sets: 0, exercises: 0 };
      }
      stats[ex.muscle].sets += ex.sets.length;
      stats[ex.muscle].exercises += 1;
    });
  });
  
  return stats as Record<MuscleGroup, { sets: number; exercises: number }>;
}

function getTotalWeight(workouts: Workout[]): number {
  let total = 0;
  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.weight && set.reps) {
          total += set.weight * set.reps;
        }
      });
    });
  });
  return Math.round(total);
}

function getTopExercise(workouts: Workout[]): { name: string; maxWeight: number } | null {
  let top: { name: string; maxWeight: number } | null = null;
  
  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.weight && (!top || set.weight > top.maxWeight)) {
          top = { name: ex.name, maxWeight: set.weight };
        }
      });
    });
  });
  
  return top;
}

export function WeeklyStories({ workouts, onClose }: WeeklyStoriesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const weekWorkouts = getLastWeekWorkouts(workouts);
  const muscleStats = getMuscleStats(weekWorkouts);
  const totalWeight = getTotalWeight(weekWorkouts);
  const topExercise = getTopExercise(weekWorkouts);
  const totalExercises = weekWorkouts.reduce((sum, w) => sum + w.exercises.length, 0);
  const totalSets = weekWorkouts.reduce((sum, w) => 
    sum + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0);
  
  const topMuscles = Object.entries(muscleStats)
    .sort(([, a], [, b]) => b.sets - a.sets)
    .slice(0, 3);
  
  const slides = [
    { id: 'summary', title: 'Итоги недели' },
    { id: 'muscles', title: 'Мышцы' },
    { id: 'records', title: 'Рекорды' },
    { id: 'motivation', title: 'Мотивация' }
  ];
  
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentSlide < slides.length - 1) {
            setCurrentSlide(c => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);
    
    return () => clearInterval(timer);
  }, [currentSlide, slides.length, onClose]);
  
  const goNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(c => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };
  
  const goPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(c => c - 1);
      setProgress(0);
    }
  };
  
  const getMuscleColor = (muscle: string): string => {
    const colors: Record<string, string> = {
      legs: '#22C55E',
      back: '#3B82F6', 
      chest: '#EF4444',
      shoulders: '#F97316',
      arms: '#A855F7',
      abs: '#EAB308',
      cardio: '#EC4899'
    };
    return colors[muscle] || '#6B7280';
  };
  
  const getMuscleLabel = (muscle: string): string => {
    return MUSCLE_GROUPS[muscle as MuscleGroup]?.label || muscle;
  };
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex gap-1 p-3 pt-safe">
        {slides.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
              style={{ 
                width: idx < currentSlide ? '100%' : idx === currentSlide ? `${progress}%` : '0%' 
              }}
            />
          </div>
        ))}
      </div>
      
      <div className="absolute top-10 left-4 z-10 flex items-center gap-2">
        <img src="/logo.png" alt="KladLift" className="w-8 h-8 object-contain opacity-80" />
        <span className="text-white/60 text-sm font-medium">KladLift</span>
      </div>
      
      <button 
        onClick={onClose}
        className="absolute top-10 right-4 z-10 p-2 text-white/80 hover:text-white"
        data-testid="button-close-stories"
      >
        <X size={24} />
      </button>
      
      <div className="flex-1 relative overflow-hidden">
        <button 
          onClick={goPrev}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          data-testid="button-story-prev"
        />
        <button 
          onClick={goNext}
          className="absolute right-0 top-0 bottom-0 w-2/3 z-10"
          data-testid="button-story-next"
        />
        
        <div className="h-full flex items-center justify-center p-6">
          {currentSlide === 0 && (
            <div className="text-center space-y-8 animate-fadeIn">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/30 rounded-full">
                  <Calendar size={18} className="text-purple-400" />
                  <span className="text-purple-300 font-medium">Твоя неделя</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white">Итоги недели</h1>
              </div>
              
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                  <Dumbbell className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white">{weekWorkouts.length}</p>
                  <p className="text-sm text-white/60">тренировок</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                  <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white">{totalExercises}</p>
                  <p className="text-sm text-white/60">упражнений</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                  <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white">{totalSets}</p>
                  <p className="text-sm text-white/60">подходов</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                  <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white">
                    {totalWeight > 1000 ? `${(totalWeight / 1000).toFixed(1)}т` : `${totalWeight}кг`}
                  </p>
                  <p className="text-sm text-white/60">общий тоннаж</p>
                </div>
              </div>
            </div>
          )}
          
          {currentSlide === 1 && (
            <div className="text-center space-y-6 animate-fadeIn w-full max-w-sm">
              <h1 className="text-3xl font-extrabold text-white">Топ мышц недели</h1>
              
              {topMuscles.length === 0 ? (
                <p className="text-white/60">Нет данных о тренировках</p>
              ) : (
                <div className="space-y-4">
                  {topMuscles.map(([muscle, stats], idx) => (
                    <div 
                      key={muscle}
                      className="bg-white/10 backdrop-blur rounded-2xl p-4 flex items-center gap-4"
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold"
                        style={{ backgroundColor: getMuscleColor(muscle) + '30', color: getMuscleColor(muscle) }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-white text-lg">{getMuscleLabel(muscle)}</p>
                        <p className="text-white/60 text-sm">{stats.sets} подходов · {stats.exercises} упражнений</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {currentSlide === 2 && (
            <div className="text-center space-y-8 animate-fadeIn">
              <h1 className="text-3xl font-extrabold text-white">Рекорд недели</h1>
              
              {topExercise ? (
                <div className="bg-gradient-to-br from-yellow-500/30 to-orange-600/30 backdrop-blur rounded-3xl p-8">
                  <div className="w-20 h-20 bg-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🏆</span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">{topExercise.name}</p>
                  <p className="text-5xl font-extrabold text-yellow-400">{topExercise.maxWeight} кг</p>
                  <p className="text-white/60 mt-2">максимальный вес</p>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur rounded-3xl p-8">
                  <p className="text-white/60">Добавляй веса в тренировки для рекордов!</p>
                </div>
              )}
            </div>
          )}
          
          {currentSlide === 3 && (
            <div className="text-center space-y-6 animate-fadeIn">
              <div className="text-6xl mb-4">💪</div>
              <h1 className="text-3xl font-extrabold text-white">
                {weekWorkouts.length >= 3 ? 'Отличная неделя!' : 
                 weekWorkouts.length >= 1 ? 'Хорошее начало!' : 
                 'Начни с понедельника!'}
              </h1>
              <p className="text-xl text-white/70 max-w-xs mx-auto">
                {weekWorkouts.length >= 3 
                  ? 'Ты молодец! Продолжай в том же духе и результаты не заставят себя ждать.' 
                  : weekWorkouts.length >= 1 
                    ? 'Каждая тренировка приближает тебя к цели. Добавь ещё пару на этой неделе!'
                    : 'Новая неделя — новые возможности. Запланируй первую тренировку!'}
              </p>
              
              <button
                onClick={onClose}
                className="mt-6 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-2xl shadow-lg"
                data-testid="button-close-stories-final"
              >
                Поехали! 🚀
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center gap-2 pb-8 pb-safe">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => { setCurrentSlide(idx); setProgress(0); }}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentSlide ? 'bg-white w-6' : 'bg-white/40'
            }`}
            data-testid={`story-dot-${idx}`}
          />
        ))}
      </div>
    </div>
  );
}

export { isStoryTimeActive };
