import { useState } from 'react';
import { ChevronLeft, Calendar, Trash2, Pencil, X, Plus, Minus } from 'lucide-react';
import type { Workout, WorkoutExercise, SetData, MuscleGroup } from '@shared/schema';
import { formatFullDate } from '@/lib/training';
import { MUSCLE_GROUPS, getCardioType } from '@shared/schema';

interface HistoryViewProps {
  workouts: Workout[];
  onEdit: (workout: Workout) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  onUpdateWorkout?: (workout: Workout) => void;
}

function getSetsWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'подходов';
  }
  
  if (lastDigit === 1) {
    return 'подход';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'подхода';
  }
  
  return 'подходов';
}

function getExercisesWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'упражнений';
  }
  
  if (lastDigit === 1) {
    return 'упражнение';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'упражнения';
  }
  
  return 'упражнений';
}

function isCardioOnlyWorkout(workout: Workout): boolean {
  return workout.exercises.length === 1 && 
         workout.exercises[0].muscle === 'cardio';
}

function getCardioSummary(workout: Workout): string {
  const exercise = workout.exercises[0];
  const totalDuration = exercise.sets.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalDistance = exercise.sets.reduce((acc, s) => acc + (s.distance || 0), 0);
  
  let summary = `${totalDuration} мин`;
  if (totalDistance > 0) {
    summary += ` • ${totalDistance.toFixed(1)} км`;
  }
  return summary;
}

function calculateTotalWeight(workout: Workout): number {
  return workout.exercises.reduce((workoutTotal, ex) => {
    if (ex.muscle === 'cardio') return workoutTotal;
    return workoutTotal + ex.sets.reduce((setTotal, set) => {
      return setTotal + (set.weight || 0) * (set.reps || 0);
    }, 0);
  }, 0);
}

function formatWeight(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)} т`;
  }
  return `${kg.toFixed(0)} кг`;
}

interface ExerciseEditorProps {
  exercise: WorkoutExercise;
  onSave: (updated: WorkoutExercise) => void;
  onCancel: () => void;
}

function ExerciseEditor({ exercise, onSave, onCancel }: ExerciseEditorProps) {
  const [sets, setSets] = useState<SetData[]>([...exercise.sets]);
  const cardioType = getCardioType(exercise.id);

  const updateSet = (idx: number, field: keyof SetData, value: number) => {
    const updated = [...sets];
    updated[idx] = { ...updated[idx], [field]: value };
    setSets(updated);
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    if (cardioType) {
      setSets([...sets, { duration: lastSet?.duration || 0, distance: lastSet?.distance, distanceUnit: lastSet?.distanceUnit || 'km' }]);
    } else {
      setSets([...sets, { weight: lastSet?.weight || 0, reps: lastSet?.reps || 0 }]);
    }
  };

  const removeSet = (idx: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== idx));
    }
  };

  const handleSave = () => {
    onSave({ ...exercise, sets });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{exercise.name}</h3>
            <span 
              className="inline-block px-2 py-0.5 rounded text-xs font-medium mt-1"
              style={{ 
                backgroundColor: MUSCLE_GROUPS[exercise.muscle as MuscleGroup]?.bg,
                color: MUSCLE_GROUPS[exercise.muscle as MuscleGroup]?.text
              }}
            >
              {MUSCLE_GROUPS[exercise.muscle as MuscleGroup]?.label}
            </span>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            data-testid="button-close-editor"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[50vh] space-y-3">
          {cardioType ? (
            sets.map((set, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center font-bold text-purple-600 dark:text-purple-400 text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={set.duration || ''}
                      onChange={(e) => updateSet(idx, 'duration', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-center font-bold text-slate-900 dark:text-slate-100"
                      data-testid={`input-duration-${idx}`}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                      МИН
                    </span>
                  </div>
                  {cardioType === 'distance' && (
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={set.distance || ''}
                        onChange={(e) => updateSet(idx, 'distance', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-center font-bold text-slate-900 dark:text-slate-100"
                        data-testid={`input-distance-${idx}`}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                        КМ
                      </span>
                    </div>
                  )}
                </div>
                {sets.length > 1 && (
                  <button 
                    onClick={() => removeSet(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    data-testid={`button-remove-set-${idx}`}
                  >
                    <Minus size={16} />
                  </button>
                )}
              </div>
            ))
          ) : (
            sets.map((set, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center font-bold text-purple-600 dark:text-purple-400 text-sm flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="number"
                      value={set.weight || ''}
                      onChange={(e) => updateSet(idx, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-center font-bold text-slate-900 dark:text-slate-100"
                      data-testid={`input-weight-${idx}`}
                    />
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium w-6 flex-shrink-0">
                      кг
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="number"
                      value={set.reps || ''}
                      onChange={(e) => updateSet(idx, 'reps', parseInt(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-center font-bold text-slate-900 dark:text-slate-100"
                      data-testid={`input-reps-${idx}`}
                    />
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium w-8 flex-shrink-0">
                      повт
                    </span>
                  </div>
                </div>
                {sets.length > 1 && (
                  <button 
                    onClick={() => removeSet(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                    data-testid={`button-remove-set-${idx}`}
                  >
                    <Minus size={16} />
                  </button>
                )}
              </div>
            ))
          )}
          
          <button
            onClick={addSet}
            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:border-purple-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
            data-testid="button-add-set"
          >
            <Plus size={18} /> Добавить подход
          </button>
        </div>
        
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            data-testid="button-cancel-edit"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            data-testid="button-save-exercise"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

export function HistoryView({ workouts, onEdit, onDelete, onBack, onUpdateWorkout }: HistoryViewProps) {
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<{ workoutId: string; exercise: WorkoutExercise } | null>(null);

  const handleSaveExercise = (updated: WorkoutExercise) => {
    if (!editingExercise || !onUpdateWorkout) return;
    
    const workout = workouts.find(w => w.id === editingExercise.workoutId);
    if (!workout) return;
    
    const updatedWorkout: Workout = {
      ...workout,
      exercises: workout.exercises.map(ex => 
        ex.id === updated.id ? updated : ex
      )
    };
    
    onUpdateWorkout(updatedWorkout);
    setEditingExercise(null);
  };

  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto animate-slideUp bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="flex items-center mb-8">
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          data-testid="button-back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">История</h1>
      </div>

      {workouts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <Calendar size={32} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Пока пусто</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Запишите свою первую тренировку
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts
            .sort((a, b) => b.date - a.date)
            .map(workout => {
              const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
              const isExpanded = expandedWorkout === workout.id;
              const isCardioOnly = isCardioOnlyWorkout(workout);
              const totalWeight = !isCardioOnly ? calculateTotalWeight(workout) : 0;
              
              return (
                <div 
                  key={workout.id} 
                  className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
                  data-testid={`workout-history-${workout.id}`}
                >
                  <div 
                    onClick={() => setExpandedWorkout(isExpanded ? null : workout.id)}
                    className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatFullDate(workout.date)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {isCardioOnly ? (
                          <>
                            {workout.exercises[0].name} • {getCardioSummary(workout)}
                          </>
                        ) : (
                          <>
                            {workout.exercises.length} {getExercisesWord(workout.exercises.length)} • {totalSets} {getSetsWord(totalSets)}
                            {totalWeight > 0 && (
                              <span className="ml-2 text-purple-600 dark:text-purple-400 font-medium">
                                • {formatWeight(totalWeight)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onEdit(workout);
                        }} 
                        className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                        data-testid={`button-edit-workout-${workout.id}`}
                        title="Редактировать тренировку"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onDelete(workout.id); 
                        }} 
                        className="p-2 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                        data-testid={`button-delete-workout-${workout.id}`}
                        title="Удалить тренировку"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-2 bg-slate-50 dark:bg-slate-850">
                      {workout.exercises.map((exercise, exIdx) => {
                        const cardioType = getCardioType(exercise.id);
                        
                        return (
                          <div 
                            key={exercise.id + '-' + exIdx}
                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"
                            data-testid={`exercise-${exercise.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: MUSCLE_GROUPS[exercise.muscle as MuscleGroup]?.color }}
                                />
                                <p className="font-medium text-slate-800 dark:text-slate-200 truncate text-sm">
                                  {exercise.name}
                                </p>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-4">
                                {cardioType ? (
                                  exercise.sets.map((set, idx) => (
                                    <span key={idx}>
                                      {set.duration} мин{set.distance ? ` • ${set.distance.toFixed(1)} км` : ''}
                                      {idx < exercise.sets.length - 1 ? ' | ' : ''}
                                    </span>
                                  ))
                                ) : (
                                  <>
                                    {exercise.sets.length} {getSetsWord(exercise.sets.length)}: {' '}
                                    {exercise.sets.map((set, idx) => (
                                      <span key={idx}>
                                        {set.weight}кг×{set.reps}
                                        {idx < exercise.sets.length - 1 ? ', ' : ''}
                                      </span>
                                    ))}
                                  </>
                                )}
                              </div>
                            </div>
                            {onUpdateWorkout && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingExercise({ workoutId: workout.id, exercise });
                                }}
                                className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors ml-2"
                                data-testid={`button-edit-exercise-${exercise.id}`}
                                title="Редактировать упражнение"
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
      
      {editingExercise && (
        <ExerciseEditor
          exercise={editingExercise.exercise}
          onSave={handleSaveExercise}
          onCancel={() => setEditingExercise(null)}
        />
      )}
    </div>
  );
}
