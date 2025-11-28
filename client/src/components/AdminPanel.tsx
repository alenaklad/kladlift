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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ObjectUploader } from '@/components/ObjectUploader';
import { 
  ArrowLeft, 
  Users, 
  Dumbbell, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X as XIcon,
  Shield,
  User as UserIcon
} from 'lucide-react';
import type { User, SelectCustomExercise, SelectUserExercise } from '@shared/schema';

interface AdminPanelProps {
  onBack: () => void;
}

interface AdminStats {
  totalUsers: number;
  totalWorkouts: number;
  activeToday: number;
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

export function AdminPanel({ onBack }: AdminPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('stats');
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<SelectCustomExercise | null>(null);

  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    muscle: '',
    type: '',
    technique: '',
    imageUrl: '',
    videoUrl: ''
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats']
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users']
  });

  const { data: exercises = [], isLoading: exercisesLoading } = useQuery<SelectCustomExercise[]>({
    queryKey: ['/api/exercises']
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<SelectUserExercise[]>({
    queryKey: ['/api/admin/submissions']
  });

  const setRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiRequest('PATCH', `/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: 'Роль изменена' });
    }
  });

  const createExerciseMutation = useMutation({
    mutationFn: (data: typeof exerciseForm) =>
      apiRequest('POST', '/api/admin/exercises', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      setIsExerciseDialogOpen(false);
      resetExerciseForm();
      toast({ title: 'Упражнение создано' });
    }
  });

  const updateExerciseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof exerciseForm }) =>
      apiRequest('PUT', `/api/admin/exercises/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      setIsExerciseDialogOpen(false);
      setEditingExercise(null);
      resetExerciseForm();
      toast({ title: 'Упражнение обновлено' });
    }
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/exercises/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      toast({ title: 'Упражнение удалено' });
    }
  });

  const approveSubmissionMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiRequest('POST', `/api/admin/submissions/${id}/approve`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      toast({ title: 'Заявка одобрена' });
    }
  });

  const rejectSubmissionMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiRequest('POST', `/api/admin/submissions/${id}/reject`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/submissions'] });
      toast({ title: 'Заявка отклонена' });
    }
  });

  const resetExerciseForm = () => {
    setExerciseForm({
      name: '',
      muscle: '',
      type: '',
      technique: '',
      imageUrl: '',
      videoUrl: ''
    });
  };

  const handleEditExercise = (exercise: SelectCustomExercise) => {
    setEditingExercise(exercise);
    setExerciseForm({
      name: exercise.name,
      muscle: exercise.muscle,
      type: exercise.type,
      technique: exercise.technique,
      imageUrl: exercise.imageUrl || '',
      videoUrl: exercise.videoUrl || ''
    });
    setIsExerciseDialogOpen(true);
  };

  const handleSaveExercise = () => {
    if (!exerciseForm.name || !exerciseForm.muscle || !exerciseForm.type || !exerciseForm.technique) {
      toast({ title: 'Заполните все обязательные поля', variant: 'destructive' });
      return;
    }

    if (editingExercise) {
      updateExerciseMutation.mutate({ id: editingExercise.id, data: exerciseForm });
    } else {
      createExerciseMutation.mutate(exerciseForm);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <div className="sticky top-0 z-10 bg-[#0A0E1A] border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-admin-back">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Админ-панель</h1>
            <p className="text-sm text-gray-500">Управление приложением</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-[#111827] mb-4">
            <TabsTrigger value="stats" className="flex-1" data-testid="tab-stats">
              Статистика
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1" data-testid="tab-users">
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex-1" data-testid="tab-exercises">
              Упражнения
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex-1" data-testid="tab-moderation">
              Модерация
              {submissions.length > 0 && (
                <Badge variant="destructive" className="ml-2">{submissions.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#111827] border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">
                      Всего пользователей
                    </CardTitle>
                    <Users className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-users">
                      {stats?.totalUsers || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#111827] border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">
                      Всего тренировок
                    </CardTitle>
                    <Dumbbell className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-workouts">
                      {stats?.totalWorkouts || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#111827] border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">
                      Активных сегодня
                    </CardTitle>
                    <Clock className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-active-today">
                      {stats?.activeToday || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2">
                  {users.map((user) => (
                    <Card key={user.id} className="bg-[#111827] border-white/10">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          {user.profileImageUrl ? (
                            <img
                              src={user.profileImageUrl}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-[#1A1F2E] rounded-full flex items-center justify-center">
                              <UserIcon size={20} className="text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium" data-testid={`user-name-${user.id}`}>
                              {user.firstName || user.email || 'Пользователь'}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.role || 'user'}
                            onValueChange={(role) => setRoleMutation.mutate({ userId: user.id, role })}
                          >
                            <SelectTrigger className="w-32 bg-[#1A1F2E] border-white/10" data-testid={`select-role-${user.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">
                                <div className="flex items-center gap-2">
                                  <UserIcon size={14} />
                                  Пользователь
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Shield size={14} />
                                  Админ
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="exercises">
            <div className="mb-4">
              <Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingExercise(null);
                      resetExerciseForm();
                    }}
                    data-testid="button-add-exercise"
                  >
                    <Plus size={16} className="mr-2" />
                    Добавить упражнение
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#111827] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingExercise ? 'Редактировать упражнение' : 'Новое упражнение'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Название *</Label>
                      <Input
                        value={exerciseForm.name}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                        placeholder="Название упражнения"
                        className="bg-[#1A1F2E] border-white/10"
                        data-testid="input-exercise-name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Группа мышц *</Label>
                        <Select
                          value={exerciseForm.muscle}
                          onValueChange={(value) => setExerciseForm({ ...exerciseForm, muscle: value })}
                        >
                          <SelectTrigger className="bg-[#1A1F2E] border-white/10" data-testid="select-exercise-muscle">
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
                        <Label>Тип *</Label>
                        <Select
                          value={exerciseForm.type}
                          onValueChange={(value) => setExerciseForm({ ...exerciseForm, type: value })}
                        >
                          <SelectTrigger className="bg-[#1A1F2E] border-white/10" data-testid="select-exercise-type">
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
                      <Label>Техника выполнения *</Label>
                      <Textarea
                        value={exerciseForm.technique}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, technique: e.target.value })}
                        placeholder="Описание техники выполнения"
                        className="bg-[#1A1F2E] border-white/10 min-h-[100px]"
                        data-testid="input-exercise-technique"
                      />
                    </div>
                    <div>
                      <Label>Фото</Label>
                      <ObjectUploader
                        accept="image"
                        currentUrl={exerciseForm.imageUrl}
                        onUploadComplete={(url) => setExerciseForm({ ...exerciseForm, imageUrl: url })}
                        label="Загрузить фото"
                      />
                    </div>
                    <div>
                      <Label>Видео</Label>
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
                        onClick={() => setIsExerciseDialogOpen(false)}
                        data-testid="button-cancel-exercise"
                      >
                        Отмена
                      </Button>
                      <Button
                        onClick={handleSaveExercise}
                        disabled={createExerciseMutation.isPending || updateExerciseMutation.isPending}
                        data-testid="button-save-exercise"
                      >
                        {createExerciseMutation.isPending || updateExerciseMutation.isPending
                          ? 'Сохранение...'
                          : 'Сохранить'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {exercisesLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-260px)]">
                <div className="space-y-2">
                  {exercises.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Нет упражнений в базе
                    </div>
                  ) : (
                    exercises.map((exercise) => (
                      <Card key={exercise.id} className="bg-[#111827] border-white/10">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            {exercise.imageUrl ? (
                              <img
                                src={exercise.imageUrl}
                                alt={exercise.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-[#1A1F2E] rounded flex items-center justify-center">
                                <Dumbbell size={20} className="text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium" data-testid={`exercise-name-${exercise.id}`}>
                                {exercise.name}
                              </p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {MUSCLE_GROUPS.find((g) => g.id === exercise.muscle)?.name || exercise.muscle}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {EXERCISE_TYPES.find((t) => t.id === exercise.type)?.name || exercise.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditExercise(exercise)}
                              data-testid={`button-edit-exercise-${exercise.id}`}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:text-red-400"
                              onClick={() => deleteExerciseMutation.mutate(exercise.id)}
                              data-testid={`button-delete-exercise-${exercise.id}`}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="moderation">
            {submissionsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-4">
                  {submissions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Нет заявок на модерацию
                    </div>
                  ) : (
                    submissions.map((submission) => (
                      <Card key={submission.id} className="bg-[#111827] border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {submission.imageUrl ? (
                              <img
                                src={submission.imageUrl}
                                alt={submission.name}
                                className="w-20 h-20 rounded object-cover"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-[#1A1F2E] rounded flex items-center justify-center">
                                <Dumbbell size={24} className="text-gray-500" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-bold text-lg" data-testid={`submission-name-${submission.id}`}>
                                {submission.name}
                              </h3>
                              <div className="flex gap-2 mt-1 mb-2">
                                <Badge variant="secondary">
                                  {MUSCLE_GROUPS.find((g) => g.id === submission.muscle)?.name || submission.muscle}
                                </Badge>
                                <Badge variant="outline">
                                  {EXERCISE_TYPES.find((t) => t.id === submission.type)?.name || submission.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-400 line-clamp-3">
                                {submission.technique}
                              </p>
                              {submission.videoUrl && (
                                <video
                                  src={submission.videoUrl}
                                  controls
                                  className="w-full mt-2 rounded max-h-40"
                                />
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/5">
                            <Button
                              variant="outline"
                              className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                              onClick={() => rejectSubmissionMutation.mutate({ id: submission.id })}
                              disabled={rejectSubmissionMutation.isPending}
                              data-testid={`button-reject-${submission.id}`}
                            >
                              <XIcon size={16} className="mr-2" />
                              Отклонить
                            </Button>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => approveSubmissionMutation.mutate({ id: submission.id })}
                              disabled={approveSubmissionMutation.isPending}
                              data-testid={`button-approve-${submission.id}`}
                            >
                              <Check size={16} className="mr-2" />
                              Одобрить
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
