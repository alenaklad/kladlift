import { ChevronLeft, Calendar, Trash2 } from 'lucide-react';
import type { Workout } from '@shared/schema';
import { formatFullDate } from '@/lib/training';

interface HistoryViewProps {
  workouts: Workout[];
  onEdit: (workout: Workout) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function HistoryView({ workouts, onEdit, onDelete, onBack }: HistoryViewProps) {
  return (
    <div className="p-6 pb-24 max-w-4xl mx-auto animate-slideUp bg-slate-50 min-h-screen">
      <div className="flex items-center mb-8">
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 mr-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          data-testid="button-back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">История</h1>
      </div>

      {workouts.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
          <div className="text-slate-500 mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Calendar size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Пока пусто</h3>
            <p className="text-slate-500">
              Запишите свою первую тренировку
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts
            .sort((a, b) => b.date - a.date)
            .map(workout => (
              <div 
                key={workout.id} 
                onClick={() => onEdit(workout)} 
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center group cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
                data-testid={`workout-history-${workout.id}`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="font-semibold text-slate-900">
                      {formatFullDate(workout.date)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">
                    {workout.exercises.length} упражнений • {workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} подходов
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onDelete(workout.id); 
                    }} 
                    className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                    data-testid={`button-delete-workout-${workout.id}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
