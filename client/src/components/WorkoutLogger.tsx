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

  // Fetch exercises from database (public exercises)
  const { data: dbExercises = [], isLoading: dbLoading } = useQuery<SelectCustomExercise[]>({
    queryKey: ['/api/exercises']
  });

  // Fetch user's personal exercises
  const { data: userExercises = [], isLoading: userLoading } = useQuery<SelectUserExercise[]>({
    queryKey: ['/api/user-exercises']
  });

  // Combine database exercises and user exercises, fallback to static DB if API fails
  const allExercises = useMemo(() => {
    // If we have database exercises, use them (combined with user exercises)
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
    // Fallback to static database if API hasn't loaded yet or failed
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
      <div className="fixed inset-0 bg-[#0A0E1A] z-50 flex flex-col animate-slideInRight">
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
            className="absolute top-6 left-6 p-3 bg-black/30 backdrop-blur-md rounded-full text-white z-10"
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

        <div className="flex-1 overflow-y-auto p-6 pb-32 bg-[#0A0E1A]">
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            {selectedExercise.technique}
          </p>

          <div className="flex gap-3 mb-8">
            <a 
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedExercise.name + ' техника')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-4 bg-red-500/20 text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors"
              data-testid="link-youtube"
            >
              <Youtube size={24} /> Техника
            </a>
            <button className="p-4 rounded-2xl bg-[#1A1F2E] text-gray-400 hover:bg-[#252A3A]">
              <Info size={24} />
            </button>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">
              Подходы
            </h3>
            {currentSets.map((set, idx) => (
              <div key={idx} className="flex items-center gap-4 animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-white text-[#0A0E1A] flex items-center justify-center font-bold text-lg">
                  {idx + 1}
                </div>
                <div className="flex-1 flex gap-4">
                  <div className="flex-1 relative">
                    <input 
                      type="number" 
                      value={set.weight || ''} 
                      onChange={(e) => updateCurrentSet(idx, 'weight', e.target.value)} 
                      className="w-full bg-[#1A1F2E] p-4 rounded-2xl text-2xl font-bold text-center text-white outline-none focus:ring-2 focus:ring-white/30 transition-all" 
                      placeholder="0" 
                      autoFocus={idx === currentSets.length - 1}
                      data-testid={`input-weight-${idx}`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none">
                      KG
                    </span>
                  </div>
                  <div className="flex-1 relative">
                    <input 
                      type="number" 
                      value={set.reps || ''} 
                      onChange={(e) => updateCurrentSet(idx, 'reps', e.target.value)} 
                      className="w-full bg-[#1A1F2E] p-4 rounded-2xl text-2xl font-bold text-center text-white outline-none focus:ring-2 focus:ring-white/30 transition-all" 
                      placeholder="0" 
                      data-testid={`input-reps-${idx}`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none">
                      REPS
                    </span>
                  </div>
                </div>
                {currentSets.length > 1 && (
                  <button 
                    onClick={() => removeSetLine(idx)} 
                    className="p-4 rounded-2xl bg-[#1A1F2E] text-gray-400 hover:text-red-500 hover:bg-red-500/20 transition-colors"
                    data-testid={`button-remove-set-${idx}`}
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={addNewSetLine} 
              className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-gray-400 font-bold hover:border-white/30 hover:text-white transition-all flex items-center justify-center gap-2"
              data-testid="button-add-set"
            >
              <Plus size={20} /> Добавить сет
            </button>
          </div>

          <div className="mt-auto sticky bottom-0 bg-[#0A0E1A] pt-4 pb-8 border-t border-white/10">
            <button 
              onClick={addExerciseToWorkout} 
              className="w-full py-5 bg-white text-[#0A0E1A] rounded-2xl font-bold text-xl shadow-2xl hover:bg-gray-100 transition-colors"
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
    <div className="p-6 pb-32 max-w-5xl mx-auto animate-fadeIn bg-[#0A0E1A] min-h-screen text-white">
      <div className="sticky top-0 z-30 bg-[#0A0E1A]/90 backdrop-blur-lg pt-6 pb-4 -mx-6 px-6 mb-6 border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Запись</h1>
          <button 
            onClick={onCancel} 
            className="p-3 bg-[#1A1F2E] rounded-full shadow-sm text-gray-400 hover:text-white transition-colors"
            data-testid="button-cancel-workout"
          >
            <X size={24} />
          </button>
        </div>

        <div className="relative mb-6 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            className="w-full bg-[#1A1F2E] pl-14 pr-6 py-4 rounded-3xl text-lg font-medium shadow-sm border border-white/5 outline-none placeholder-gray-500 text-white group-focus-within:border-white/20 transition-all" 
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
                    ? 'bg-white text-[#0A0E1A] shadow-lg scale-105' 
                    : 'bg-[#1A1F2E] text-gray-400 hover:bg-[#252A3A]'
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
        <div className="mb-8 bg-[#111827] p-6 rounded-[2rem] shadow-xl border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Сводка</span>
            <span className="bg-white text-[#0A0E1A] text-xs font-bold px-3 py-1 rounded-full">
              {exercises.length}
            </span>
          </div>
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <div 
                key={i} 
                className="flex justify-between items-center p-3 bg-[#1A1F2E] rounded-2xl"
                data-testid={`workout-summary-exercise-${i}`}
              >
                <span className="font-bold text-white truncate mr-4">{ex.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400">{ex.sets.length} sets</span>
                  <button 
                    onClick={() => setExercises(exercises.filter((_, idx) => idx !== i))} 
                    className="text-gray-500 hover:text-red-500"
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
            className="bg-[#111827] rounded-[2rem] p-3 shadow-sm border border-white/5 hover:border-white/20 transition-all duration-500 group cursor-pointer transform hover:-translate-y-1"
            data-testid={`exercise-card-${ex.id}`}
          >
            <div className="relative h-56 w-full rounded-[1.5rem] overflow-hidden bg-[#1A1F2E] mb-4">
              <img 
                src={getVisualForExercise(ex)} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt={ex.name} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white group-hover:scale-110 transition-transform">
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
              <h3 className="font-bold text-xl text-white leading-tight group-hover:text-blue-400 transition-colors">
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
            className="w-full max-w-md shadow-2xl shadow-black/40 py-6 text-xl flex items-center justify-between px-8 rounded-3xl bg-black text-white font-bold scale-100 active:scale-95 transition-transform border border-white/10"
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
