import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ObjectUploader } from '@/components/ObjectUploader';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Send,
  Dumbbell,
  Clock,
  Check,
  X as XIcon
} from 'lucide-react';
import type { SelectUserExercise } from '@shared/schema';

interface UserExerciseCreatorProps {
  onBack: () => void;
}

const MUSCLE_GROUPS = [
  { id: 'legs', name: 'Ноги' },
  { id: 'back', name: 'Спина' },
  { id: 'chest', name: 'Грудь' },
  { id: 'shoulders', name: 'Плечи' },
  { id: 'arms', name: 'Руки' },
  { id: 'abs', name: 'Пресс' },
  { id: 'cardio', name: 'Кардио' }
];

const EXERCISE_TYPES = [
  { id: 'compound', name: 'Базовое' },
  { id: 'isolation', name: 'Изолированное' }
];

const STATUS_LABELS: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { text: 'Активно', variant: 'secondary' },
  pending: { text: 'На модерации', variant: 'outline' },
  approved: { text: 'Одобрено', variant: 'default' },
  rejected: { text: 'Отклонено', variant: 'destructive' }
};

export function UserExerciseCreator({ onBack }: UserExerciseCreatorProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<SelectUserExercise | null>(null);

  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    muscle: '',
    type: '',
    technique: '',
    imageUrl: '',
    videoUrl: ''
  });

  const { data: exercises = [], isLoading } = useQuery<SelectUserExercise[]>({
    queryKey: ['/api/user-exercises']
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof exerciseForm) =>
      apiRequest('POST', '/api/user-exercises', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-exercises'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Упражнение создано' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof exerciseForm }) =>
      apiRequest('PUT', `/api/user-exercises/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-exercises'] });
      setIsDialogOpen(false);
      setEditingExercise(null);
      resetForm();
      toast({ title: 'Упражнение обновлено' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/user-exercises/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-exercises'] });
      toast({ title: 'Упражнение удалено' });
    }
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => apiRequest('POST', `/api/user-exercises/${id}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-exercises'] });
      toast({ title: 'Упражнение отправлено на модерацию' });
    }
  });

  const resetForm = () => {
    setExerciseForm({
      name: '',
      muscle: '',
      type: '',
      technique: '',
      imageUrl: '',
      videoUrl: ''
    });
  };

  const handleEdit = (exercise: SelectUserExercise) => {
    setEditingExercise(exercise);
    setExerciseForm({
      name: exercise.name,
      muscle: exercise.muscle,
      type: exercise.type,
      technique: exercise.technique,
      imageUrl: exercise.imageUrl || '',
      videoUrl: exercise.videoUrl || ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!exerciseForm.name || !exerciseForm.muscle || !exerciseForm.type || !exerciseForm.technique) {
      toast({ title: 'Заполните все обязательные поля', variant: 'destructive' });
      return;
    }

    if (editingExercise) {
      updateMutation.mutate({ id: editingExercise.id, data: exerciseForm });
    } else {
      createMutation.mutate(exerciseForm);
    }
  };

  const canSubmit = (exercise: SelectUserExercise) => {
    return exercise.status === 'active' || exercise.status === 'rejected';
  };

  const canEdit = (exercise: SelectUserExercise) => {
    return exercise.status !== 'pending' && exercise.status !== 'approved';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-exercises-back" className="text-slate-500 hover:text-slate-900">
              <ArrowLeft size={24} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Мои упражнения</h1>
              <p className="text-sm text-slate-500">Создавайте свои упражнения</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingExercise(null);
                  resetForm();
                }}
                data-testid="button-create-exercise"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                <Plus size={16} className="mr-2" />
                Создать
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-900">
                  {editingExercise ? 'Редактировать упражнение' : 'Новое упражнение'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-slate-700">Название *</Label>
                  <Input
                    value={exerciseForm.name}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                    placeholder="Название упражнения"
                    className="bg-white border-slate-200"
                    data-testid="input-user-exercise-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700">Группа мышц *</Label>
                    <Select
                      value={exerciseForm.muscle}
                      onValueChange={(value) => setExerciseForm({ ...exerciseForm, muscle: value })}
                    >
                      <SelectTrigger className="bg-white border-slate-200" data-testid="select-user-exercise-muscle">
                        <SelectValue placeholder="Выберите" />
                      </SelectTrigger>
                      <SelectContent>
                        {MUSCLE_GROUPS.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-700">Тип *</Label>
                    <Select
                      value={exerciseForm.type}
                      onValueChange={(value) => setExerciseForm({ ...exerciseForm, type: value })}
                    >
                      <SelectTrigger className="bg-white border-slate-200" data-testid="select-user-exercise-type">
                        <SelectValue placeholder="Выберите" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXERCISE_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-700">Техника выполнения *</Label>
                  <Textarea
                    value={exerciseForm.technique}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, technique: e.target.value })}
                    placeholder="Описание техники выполнения"
                    className="bg-white border-slate-200 min-h-[100px]"
                    data-testid="input-user-exercise-technique"
                  />
                </div>
                <div>
                  <Label className="text-slate-700">Фото (опционально)</Label>
                  <ObjectUploader
                    accept="image"
                    currentUrl={exerciseForm.imageUrl}
                    onUploadComplete={(url) => setExerciseForm({ ...exerciseForm, imageUrl: url })}
                    label="Загрузить фото"
                  />
                </div>
                <div>
                  <Label className="text-slate-700">Видео (опционально)</Label>
                  <ObjectUploader
                    accept="video"
                    currentUrl={exerciseForm.videoUrl}
                    onUploadComplete={(url) => setExerciseForm({ ...exerciseForm, videoUrl: url })}
                    label="Загрузить видео"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-user-exercise"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-user-exercise"
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Сохранение...'
                      : 'Сохранить'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="space-y-3">
              {exercises.length === 0 ? (
                <div className="text-center py-12">
                  <Dumbbell size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">
                    Нет своих упражнений
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Создайте упражнение и отправьте на модерацию для публикации
                  </p>
                </div>
              ) : (
                exercises.map((exercise) => (
                  <Card key={exercise.id} className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {exercise.imageUrl ? (
                          <img
                            src={exercise.imageUrl}
                            alt={exercise.name}
                            className="w-16 h-16 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                            <Dumbbell size={24} className="text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium text-slate-900 truncate" data-testid={`user-exercise-name-${exercise.id}`}>
                                {exercise.name}
                              </h3>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {MUSCLE_GROUPS.find((g) => g.id === exercise.muscle)?.name || exercise.muscle}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {EXERCISE_TYPES.find((t) => t.id === exercise.type)?.name || exercise.type}
                                </Badge>
                                <Badge 
                                  variant={STATUS_LABELS[exercise.status || 'active'].variant}
                                  className="text-xs"
                                >
                                  {STATUS_LABELS[exercise.status || 'active'].text}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                            {exercise.technique}
                          </p>
                          {exercise.reviewNotes && (
                            <div className="mt-2 p-2 bg-slate-50 rounded text-sm border border-slate-100">
                              <span className="text-slate-500">Комментарий модератора: </span>
                              <span className="text-slate-600">{exercise.reviewNotes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                        {canEdit(exercise) && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(exercise)}
                              data-testid={`button-edit-user-exercise-${exercise.id}`}
                              className="text-slate-600 hover:text-slate-900"
                            >
                              <Edit size={14} className="mr-1" />
                              Редактировать
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => deleteMutation.mutate(exercise.id)}
                              data-testid={`button-delete-user-exercise-${exercise.id}`}
                            >
                              <Trash2 size={14} className="mr-1" />
                              Удалить
                            </Button>
                          </>
                        )}
                        {canSubmit(exercise) && (
                          <Button
                            size="sm"
                            onClick={() => submitMutation.mutate(exercise.id)}
                            disabled={submitMutation.isPending}
                            data-testid={`button-submit-user-exercise-${exercise.id}`}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                          >
                            <Send size={14} className="mr-1" />
                            Отправить на модерацию
                          </Button>
                        )}
                        {exercise.status === 'pending' && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock size={14} />
                            Ожидает проверки
                          </div>
                        )}
                        {exercise.status === 'approved' && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <Check size={14} />
                            Добавлено в общую базу
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
