import { useState } from 'react';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserProfile } from '@shared/schema';

const profileSchema = z.object({
  sleep: z.number().min(4).max(10),
  stress: z.enum(['low', 'moderate', 'high']),
  calories: z.enum(['deficit', 'maintenance', 'surplus']),
  trainingDays: z.number().min(2).max(6)
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileViewProps {
  user: UserProfile;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
  onBack: () => void;
}

export function ProfileView({ user, onSave, onBack }: ProfileViewProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      sleep: user.sleep || 7,
      stress: user.stress || 'moderate',
      calories: user.calories || 'maintenance',
      trainingDays: user.trainingDays || 3
    }
  });

  const handleSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      await onSave(data);
    } finally {
      setIsSaving(false);
    }
  };

  const stressLabels = {
    low: 'Низкий',
    moderate: 'Средний',
    high: 'Высокий'
  };

  const caloriesLabels = {
    deficit: 'Дефицит',
    maintenance: 'Поддержание',
    surplus: 'Профицит'
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            data-testid="button-back"
          >
            <ChevronLeft size={24} className="text-slate-600 dark:text-slate-400" />
          </button>
          <h1 className="font-bold text-lg text-slate-900 dark:text-white">Настройки профиля</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">
            Факторы восстановления
          </h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="sleep"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-4">
                      <FormLabel className="text-base font-medium text-slate-700 dark:text-slate-300">
                        Сон
                      </FormLabel>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {field.value} <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">часов</span>
                      </span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                        min={4}
                        max={10}
                        step={0.5}
                        className="py-2"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-2">
                      <span>4 часа</span>
                      <span>10 часов</span>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                      Уровень стресса
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger 
                          className="h-14 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          data-testid="select-stress"
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <SelectItem value="low" className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            Низкий
                          </div>
                        </SelectItem>
                        <SelectItem value="moderate" className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            Средний
                          </div>
                        </SelectItem>
                        <SelectItem value="high" className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            Высокий
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                      Калорийность питания
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger 
                          className="h-14 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          data-testid="select-calories"
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <SelectItem value="deficit" className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            Дефицит (похудение)
                          </div>
                        </SelectItem>
                        <SelectItem value="maintenance" className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            Поддержание
                          </div>
                        </SelectItem>
                        <SelectItem value="surplus" className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                            Профицит (набор массы)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trainingDays"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-4">
                      <FormLabel className="text-base font-medium text-slate-700 dark:text-slate-300">
                        Тренировочных дней в неделю
                      </FormLabel>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {field.value}
                      </span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                        min={2}
                        max={6}
                        step={1}
                        className="py-2"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-2">
                      <span>2 дня</span>
                      <span>6 дней</span>
                    </div>
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={isSaving || !form.formState.isDirty}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/25 hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="button-save-profile"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Сохранить изменения
                  </>
                )}
              </button>
            </form>
          </Form>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
            Информация профиля
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Пол</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {user.gender === 'female' ? 'Женский' : 'Мужской'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Возраст</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{user.age} лет</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Вес</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{user.weight} кг</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Рост</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{user.height} см</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 dark:text-slate-400">Опыт тренировок</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {user.experienceYears?.toFixed(1)} лет
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
