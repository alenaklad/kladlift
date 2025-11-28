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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fadeIn">
      <div className="bg-[#111827] w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/5">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Статистика тела</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            data-testid="button-close-body-modal"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!showForm ? (
            <button 
              onClick={() => setShowForm(true)}
              className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-gray-400 font-bold hover:border-white/30 hover:text-white transition-all flex items-center justify-center gap-2"
              data-testid="button-add-measurement"
            >
              <Plus size={20} /> Добавить замер
            </button>
          ) : (
            <div className="bg-[#1A1F2E] p-4 rounded-2xl space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Вес (кг)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-center text-white outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  placeholder="70"
                  data-testid="input-weight"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Процент жира (опционально)
                </label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-center text-white outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  placeholder="15"
                  data-testid="input-fat"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-[#252A3A] text-gray-300 rounded-xl font-bold hover:bg-[#2F3545] transition-colors"
                  data-testid="button-cancel-measurement"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-white text-[#0A0E1A] rounded-xl font-bold hover:bg-gray-100 transition-colors"
                  data-testid="button-save-measurement"
                >
                  Сохранить
                </button>
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="space-y-2 mt-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                История замеров
              </h3>
              {logs
                .sort((a, b) => b.date - a.date)
                .map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-4 bg-[#1A1F2E] rounded-2xl"
                    data-testid={`body-log-${log.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-gray-500" />
                      <div>
                        <div className="font-bold text-white">
                          {log.weight} кг
                          {log.fat && <span className="text-gray-400 ml-2">{log.fat}%</span>}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatFullDate(log.date)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(log.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
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
