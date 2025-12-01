import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  X, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ChevronLeft,
  Info,
  Youtube
} from 'lucide-react';
import { 
  MUSCLE_GROUPS, 
  type Exercise as ExerciseType, 
  type WorkoutExercise, 
  type SetData,
  type MuscleGroup,
  type SelectCustomExercise,
  type SelectUserExercise
} from '@shared/schema';
import { getVisualForExercise, FULL_EXERCISE_DB } from '@/lib/exercises';
import { MuscleTarget } from './MuscleTarget';

interface WorkoutLoggerProps {
  onSave: (exercises: WorkoutExercise[]) => void;
  onCancel: () => void;
  initialExercises?: WorkoutExercise[];
}

export function WorkoutLogger({ onSave, onCancel, initialExercises = [] }: WorkoutLoggerProps) {
  const [exercises, setExercises] = useState<WorkoutExercise[]>(initialExercises);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);
  const [currentSets, setCurrentSets] = useState<SetData[]>([{ weight: 0, reps: 0 }]);
  const [activeCategory, setActiveCategory] = useState<MuscleGroup>('legs');
  const [search, setSearch] = useState('');

  const { data: dbExercises = [], isLoading: dbLoading } = useQuery<SelectCustomExercise[]>({
    queryKey: ['/api/exercises']
  });

  const { data: userExercises = [], isLoading: userLoading } = useQuery<SelectUserExercise[]>({
    queryKey: ['/api/user-exercises']
  });

  const allExercises = useMemo(() => {
    if (dbExercises.length > 0) {
      const combined: ExerciseType[] = [
        ...dbExercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          muscle: ex.muscle as MuscleGroup,
          type: ex.type as 'compound' | 'isolation',
          technique: ex.technique
        })),
        ...userExercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          muscle: ex.muscle as MuscleGroup,
          type: ex.type as 'compound' | 'isolation',
          technique: ex.technique
        }))
      ];
      return combined;
    }
    return FULL_EXERCISE_DB;
  }, [dbExercises, userExercises]);

  const isLoadingExercises = dbLoading || userLoading;

  const filteredDB = useMemo(() => {
    if (search.trim()) {
      return allExercises.filter(ex => 
        ex.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return allExercises.filter(ex => ex.muscle === activeCategory);
  }, [activeCategory, search, allExercises]);

  const handleSave = () => {
    if (exercises.length > 0) {
      onSave(exercises);
    }
  };

  const addNewSetLine = () => {
    const lastSet = currentSets[currentSets.length - 1];
    setCurrentSets([...currentSets, { weight: lastSet?.weight || 0, reps: lastSet?.reps || 0 }]);
  };

  const removeSetLine = (idx: number) => {
    setCurrentSets(currentSets.filter((_, i) => i !== idx));
  };

  const updateCurrentSet = (idx: number, field: keyof SetData, value: string) => {
    const updated = [...currentSets];
    updated[idx] = { ...updated[idx], [field]: parseFloat(value) || 0 };
    setCurrentSets(updated);
  };

  const addExerciseToWorkout = () => {
    if (!selectedExercise) return;
    const validSets = currentSets.filter(s => s.weight > 0 || s.reps > 0);
    if (validSets.length === 0) return;

    const newExercise: WorkoutExercise = {
      id: selectedExercise.id,
      name: selectedExercise.name,
      muscle: selectedExercise.muscle,
      sets: validSets
    };

    setExercises([...exercises, newExercise]);
    setSelectedExercise(null);
    setCurrentSets([{ weight: 0, reps: 0 }]);
  };

  if (selectedExercise) {
    return (
      <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col animate-slideInRight">
        <div 
          className="relative h-64 flex items-end p-6"
          style={{ 
            backgroundImage: `url(${getVisualForExercise(selectedExercise)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          <button 
            onClick={() => {
              setSelectedExercise(null);
              setCurrentSets([{ weight: 0, reps: 0 }]);
            }}
            className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white z-10 hover:bg-white/30 transition-colors"
            data-testid="button-back-from-exercise"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="relative z-10">
            <span 
              className="inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ 
                backgroundColor: MUSCLE_GROUPS[selectedExercise.muscle]?.bg,
                color: MUSCLE_GROUPS[selectedExercise.muscle]?.text
              }}
            >
              {MUSCLE_GROUPS[selectedExercise.muscle]?.label}
            </span>
            <h1 className="text-3xl font-extrabold text-white leading-tight">
              {selectedExercise.name}
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-32 bg-slate-50">
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            {selectedExercise.technique}
          </p>

          <div className="flex gap-3 mb-8">
            <a 
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedExercise.name + ' техника')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors border border-red-100"
              data-testid="link-youtube"
            >
              <Youtube size={24} /> Техника
            </a>
            <button className="p-4 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              <Info size={24} />
            </button>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
              Подходы
            </h3>
            {currentSets.map((set, idx) => (
              <div key={idx} className="flex items-center gap-4 animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {idx + 1}
                </div>
                <div className="flex-1 flex gap-4">
                  <div className="flex-1 relative">
                    <input 
                      type="number" 
                      value={set.weight || ''} 
                      onChange={(e) => updateCurrentSet(idx, 'weight', e.target.value)} 
                      className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-2xl font-bold text-center text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all shadow-sm" 
                      placeholder="0" 
                      autoFocus={idx === currentSets.length - 1}
                      data-testid={`input-weight-${idx}`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      KG
                    </span>
                  </div>
                  <div className="flex-1 relative">
                    <input 
                      type="number" 
                      value={set.reps || ''} 
                      onChange={(e) => updateCurrentSet(idx, 'reps', e.target.value)} 
                      className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-2xl font-bold text-center text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all shadow-sm" 
                      placeholder="0" 
                      data-testid={`input-reps-${idx}`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      REPS
                    </span>
                  </div>
                </div>
                {currentSets.length > 1 && (
                  <button 
                    onClick={() => removeSetLine(idx)} 
                    className="p-4 rounded-2xl bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    data-testid={`button-remove-set-${idx}`}
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={addNewSetLine} 
              className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:border-purple-500 hover:text-purple-600 transition-all flex items-center justify-center gap-2"
              data-testid="button-add-set"
            >
              <Plus size={20} /> Добавить сет
            </button>
          </div>

          <div className="mt-auto sticky bottom-0 bg-slate-50 pt-4 pb-8 border-t border-slate-200">
            <button 
              onClick={addExerciseToWorkout} 
              className="w-full py-5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl font-bold text-xl shadow-lg shadow-purple-500/25 hover:from-purple-700 hover:to-purple-800 transition-colors"
              data-testid="button-save-exercise"
            >
              Сохранить результат
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-32 max-w-5xl mx-auto animate-fadeIn bg-slate-50 min-h-screen">
      <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-lg pt-6 pb-4 -mx-6 px-6 mb-6 border-b border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Запись</h1>
          <button 
            onClick={onCancel} 
            className="p-3 bg-white border border-slate-200 rounded-full shadow-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            data-testid="button-cancel-workout"
          >
            <X size={24} />
          </button>
        </div>

        <div className="relative mb-6 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            className="w-full bg-white pl-14 pr-6 py-4 rounded-3xl text-lg font-medium shadow-sm border border-slate-200 outline-none placeholder-slate-400 text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all" 
            placeholder="Поиск упражнения..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            data-testid="input-search-exercise"
          />
        </div>

        {!search && (
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide -mx-6 px-6">
            {(Object.keys(MUSCLE_GROUPS) as MuscleGroup[]).map(key => (
              <button 
                key={key} 
                onClick={() => setActiveCategory(key)}
                className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  activeCategory === key 
                    ? 'bg-slate-900 text-white shadow-lg scale-105' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                data-testid={`button-category-${key}`}
              >
                {MUSCLE_GROUPS[key].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {exercises.length > 0 && (
        <div className="mb-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Сводка</span>
            <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              {exercises.length}
            </span>
          </div>
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <div 
                key={i} 
                className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl"
                data-testid={`workout-summary-exercise-${i}`}
              >
                <span className="font-bold text-slate-900 truncate mr-4">{ex.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500">{ex.sets.length} sets</span>
                  <button 
                    onClick={() => setExercises(exercises.filter((_, idx) => idx !== i))} 
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    data-testid={`button-remove-exercise-${i}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {filteredDB.map(ex => (
          <div 
            key={ex.id} 
            onClick={() => setSelectedExercise(ex)} 
            className="bg-white rounded-[2rem] p-3 shadow-sm border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-500 group cursor-pointer transform hover:-translate-y-1"
            data-testid={`exercise-card-${ex.id}`}
          >
            <div className="relative h-56 w-full rounded-[1.5rem] overflow-hidden bg-slate-100 mb-4">
              <img 
                src={getVisualForExercise(ex)} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt={ex.name} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full text-purple-600 group-hover:scale-110 transition-transform shadow-lg">
                <Plus size={24} />
              </div>
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/10">
                  {MUSCLE_GROUPS[ex.muscle].label}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 w-8 h-12 opacity-80">
                <MuscleTarget muscle={ex.muscle} />
              </div>
            </div>
            <div className="px-2 pb-2">
              <h3 className="font-bold text-xl text-slate-900 leading-tight group-hover:text-purple-600 transition-colors">
                {ex.name}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {exercises.length > 0 && (
        <div className="fixed bottom-8 left-0 right-0 z-40 flex justify-center px-6">
          <button 
            onClick={handleSave} 
            className="w-full max-w-md shadow-2xl shadow-purple-500/30 py-6 text-xl flex items-center justify-between px-8 rounded-3xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold scale-100 active:scale-95 transition-transform"
            data-testid="button-finish-workout"
          >
            <span className="font-bold">Завершить тренировку</span>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-3 py-1 rounded-xl text-sm font-mono">
                {exercises.length}
              </span>
              <ArrowRight size={24} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
