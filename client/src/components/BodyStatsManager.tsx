import { useState } from 'react';
import { X, Plus, Trash2, Calendar } from 'lucide-react';
import type { BodyLog } from '@shared/schema';
import { formatFullDate } from '@/lib/training';

interface BodyStatsManagerProps {
  currentWeight: number;
  currentFat?: number;
  logs: BodyLog[];
  onClose: () => void;
  onSave: (weight: number, fat: number | undefined, date: number) => void;
  onDelete: (id: string) => void;
}

export function BodyStatsManager({
  currentWeight,
  currentFat,
  logs,
  onClose,
  onSave,
  onDelete
}: BodyStatsManagerProps) {
  const [weight, setWeight] = useState(currentWeight.toString());
  const [fat, setFat] = useState(currentFat?.toString() || '');
  const [showForm, setShowForm] = useState(false);

  const handleSave = () => {
    const w = parseFloat(weight);
    const f = fat ? parseFloat(fat) : undefined;
    if (w > 0) {
      onSave(w, f, Date.now());
      setShowForm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fadeIn">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Статистика тела</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            data-testid="button-close-body-modal"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!showForm ? (
            <button 
              onClick={() => setShowForm(true)}
              className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:border-purple-500 hover:text-purple-600 transition-all flex items-center justify-center gap-2"
              data-testid="button-add-measurement"
            >
              <Plus size={20} /> Добавить замер
            </button>
          ) : (
            <div className="bg-slate-50 p-4 rounded-2xl space-y-4 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Вес (кг)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-center text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                  placeholder="70"
                  data-testid="input-weight"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Процент жира (опционально)
                </label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-center text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                  placeholder="15"
                  data-testid="input-fat"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                  data-testid="button-cancel-measurement"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold hover:from-purple-700 hover:to-purple-800 transition-colors"
                  data-testid="button-save-measurement"
                >
                  Сохранить
                </button>
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="space-y-2 mt-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                История замеров
              </h3>
              {logs
                .sort((a, b) => b.date - a.date)
                .map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
                    data-testid={`body-log-${log.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-slate-400" />
                      <div>
                        <div className="font-bold text-slate-900">
                          {log.weight} кг
                          {log.fat && <span className="text-slate-500 ml-2">{log.fat}%</span>}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatFullDate(log.date)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(log.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      data-testid={`button-delete-log-${log.id}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
