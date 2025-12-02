import { useState, useMemo } from 'react';
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
  User as UserIcon,
  BarChart3,
  AlertCircle,
  Search,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';
import type { User, SelectCustomExercise, SelectUserExercise } from '@shared/schema';

interface AdminPanelProps {
  onBack: () => void;
}

interface AdminStats {
  totalUsers: number;
  totalWorkouts: number;
  activeToday: number;
  newUsersThisWeek?: number;
  newUsersThisMonth?: number;
  avgWorkoutsPerUser?: number;
}

const MUSCLE_GROUPS = [
  { id: 'legs', name: 'Ноги', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
  { id: 'back', name: 'Спина', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  { id: 'chest', name: 'Грудь', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  { id: 'shoulders', name: 'Плечи', color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' },
  { id: 'arms', name: 'Руки', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' },
  { id: 'abs', name: 'Пресс', color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700' },
  { id: 'cardio', name: 'Кардио', color: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800' }
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<string>('all');

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

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = searchQuery === '' || 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle = filterMuscle === 'all' || ex.muscle === filterMuscle;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchQuery, filterMuscle]);

  const exercisesByMuscle = useMemo(() => {
    const counts: Record<string, number> = {};
    exercises.forEach(ex => {
      counts[ex.muscle] = (counts[ex.muscle] || 0) + 1;
    });
    return counts;
  }, [exercises]);

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

  const getMuscleGroupStyle = (muscleId: string) => {
    return MUSCLE_GROUPS.find(g => g.id === muscleId)?.color || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack} 
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            data-testid="button-admin-back"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Админ-панель</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Управление приложением KladLift</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 mb-6">
            <TabsTrigger 
              value="stats" 
              className="data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 px-4"
              data-testid="tab-stats"
            >
              <BarChart3 size={16} className="mr-2" />
              Статистика
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 px-4"
              data-testid="tab-users"
            >
              <Users size={16} className="mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger 
              value="exercises" 
              className="data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 px-4"
              data-testid="tab-exercises"
            >
              <Dumbbell size={16} className="mr-2" />
              Упражнения
            </TabsTrigger>
            <TabsTrigger 
              value="moderation" 
              className="data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 px-4 relative"
              data-testid="tab-moderation"
            >
              <AlertCircle size={16} className="mr-2" />
              Модерация
              {submissions.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {submissions.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            {statsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Всего пользователей
                      </CardTitle>
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white" data-testid="stat-total-users">
                        {stats?.totalUsers || 0}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">зарегистрировано</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Всего тренировок
                      </CardTitle>
                      <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white" data-testid="stat-total-workouts">
                        {stats?.totalWorkouts || 0}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">записано</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Активных сегодня
                      </CardTitle>
                      <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white" data-testid="stat-active-today">
                        {stats?.activeToday || 0}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">пользователей</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Новых за неделю
                      </CardTitle>
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white" data-testid="stat-new-week">
                        {stats?.newUsersThisWeek || 0}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">новых пользователей</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Среднее тренировок
                      </CardTitle>
                      <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                        <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white" data-testid="stat-avg-workouts">
                        {stats?.avgWorkoutsPerUser?.toFixed(1) || '0'}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">на пользователя</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      Упражнения по группам мышц
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {MUSCLE_GROUPS.map(group => (
                        <div 
                          key={group.id}
                          className="flex flex-col items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                        >
                          <span className={`text-xs px-2 py-1 rounded-full border ${group.color}`}>
                            {group.name}
                          </span>
                          <span className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
                            {exercisesByMuscle[group.id] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            {usersLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    Пользователи ({users.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-4">
                          {user.profileImageUrl ? (
                            <img
                              src={user.profileImageUrl}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                              <UserIcon size={20} className="text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white" data-testid={`user-name-${user.id}`}>
                              {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Пользователь'}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                          </div>
                        </div>
                        <Select
                          value={user.role || 'user'}
                          onValueChange={(role) => setRoleMutation.mutate({ userId: user.id, role })}
                        >
                          <SelectTrigger 
                            className="w-40 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" 
                            data-testid={`select-role-${user.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                            <SelectItem value="user" className="text-slate-700 dark:text-slate-200">
                              <div className="flex items-center gap-2">
                                <UserIcon size={14} className="text-slate-500 dark:text-slate-400" />
                                Пользователь
                              </div>
                            </SelectItem>
                            <SelectItem value="admin" className="text-slate-700 dark:text-slate-200">
                              <div className="flex items-center gap-2">
                                <Shield size={14} className="text-purple-600 dark:text-purple-400" />
                                Админ
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="exercises">
            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">База упражнений</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {filteredExercises.length} из {exercises.length} упражнений
                  </p>
                </div>
                <Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingExercise(null);
                        resetExerciseForm();
                      }}
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900"
                      data-testid="button-add-exercise"
                    >
                      <Plus size={16} className="mr-2" />
                      Добавить упражнение
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-slate-900 dark:text-white">
                        {editingExercise ? 'Редактировать упражнение' : 'Новое упражнение'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label className="text-slate-700 dark:text-slate-300">Название *</Label>
                        <Input
                          value={exerciseForm.name}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                          placeholder="Название упражнения"
                          className="mt-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          data-testid="input-exercise-name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-700 dark:text-slate-300">Группа мышц *</Label>
                          <Select
                            value={exerciseForm.muscle}
                            onValueChange={(value) => setExerciseForm({ ...exerciseForm, muscle: value })}
                          >
                            <SelectTrigger 
                              className="mt-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" 
                              data-testid="select-exercise-muscle"
                            >
                              <SelectValue placeholder="Выберите" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                              {MUSCLE_GROUPS.map((group) => (
                                <SelectItem key={group.id} value={group.id} className="text-slate-700 dark:text-slate-200">
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-slate-700 dark:text-slate-300">Тип *</Label>
                          <Select
                            value={exerciseForm.type}
                            onValueChange={(value) => setExerciseForm({ ...exerciseForm, type: value })}
                          >
                            <SelectTrigger 
                              className="mt-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" 
                              data-testid="select-exercise-type"
                            >
                              <SelectValue placeholder="Выберите" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                              {EXERCISE_TYPES.map((type) => (
                                <SelectItem key={type.id} value={type.id} className="text-slate-700 dark:text-slate-200">
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-700 dark:text-slate-300">Техника выполнения *</Label>
                        <Textarea
                          value={exerciseForm.technique}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, technique: e.target.value })}
                          placeholder="Описание техники выполнения"
                          className="mt-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[100px]"
                          data-testid="input-exercise-technique"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 dark:text-slate-300">Фото</Label>
                        <div className="mt-1.5">
                          <ObjectUploader
                            accept="image"
                            currentUrl={exerciseForm.imageUrl}
                            onUploadComplete={(url) => setExerciseForm({ ...exerciseForm, imageUrl: url })}
                            label="Загрузить фото"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-700 dark:text-slate-300">Видео</Label>
                        <div className="mt-1.5">
                          <ObjectUploader
                            accept="video"
                            currentUrl={exerciseForm.videoUrl}
                            onUploadComplete={(url) => setExerciseForm({ ...exerciseForm, videoUrl: url })}
                            label="Загрузить видео"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button
                          variant="outline"
                          onClick={() => setIsExerciseDialogOpen(false)}
                          className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          data-testid="button-cancel-exercise"
                        >
                          Отмена
                        </Button>
                        <Button
                          onClick={handleSaveExercise}
                          disabled={createExerciseMutation.isPending || updateExerciseMutation.isPending}
                          className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900"
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

              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <Input
                    placeholder="Поиск упражнений..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    data-testid="input-search-exercises"
                  />
                </div>
                <Select value={filterMuscle} onValueChange={setFilterMuscle}>
                  <SelectTrigger 
                    className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    data-testid="select-filter-muscle"
                  >
                    <SelectValue placeholder="Все группы мышц" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="all" className="text-slate-700 dark:text-slate-200">
                      Все группы мышц
                    </SelectItem>
                    {MUSCLE_GROUPS.map((group) => (
                      <SelectItem key={group.id} value={group.id} className="text-slate-700 dark:text-slate-200">
                        {group.name} ({exercisesByMuscle[group.id] || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {exercisesLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <CardContent className="p-0">
                  {filteredExercises.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <Dumbbell className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                      <p>{searchQuery || filterMuscle !== 'all' ? 'Упражнения не найдены' : 'Нет упражнений в базе'}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredExercises.map((exercise) => (
                        <div key={exercise.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-center gap-4">
                            {exercise.imageUrl ? (
                              <img
                                src={exercise.imageUrl}
                                alt={exercise.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                <Dumbbell size={20} className="text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white" data-testid={`exercise-name-${exercise.id}`}>
                                {exercise.name}
                              </p>
                              <div className="flex gap-2 mt-1.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${getMuscleGroupStyle(exercise.muscle)}`}>
                                  {MUSCLE_GROUPS.find((g) => g.id === exercise.muscle)?.name || exercise.muscle}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                  {EXERCISE_TYPES.find((t) => t.id === exercise.type)?.name || exercise.type}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditExercise(exercise)}
                              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                              data-testid={`button-edit-exercise-${exercise.id}`}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                              onClick={() => deleteExerciseMutation.mutate(exercise.id)}
                              data-testid={`button-delete-exercise-${exercise.id}`}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="moderation">
            {submissionsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <div>
                {submissions.length === 0 ? (
                  <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="py-12 text-center">
                      <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
                      <p className="text-slate-600 dark:text-slate-300">Нет заявок на модерацию</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Все упражнения проверены</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <Card key={submission.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {submission.imageUrl ? (
                              <img
                                src={submission.imageUrl}
                                alt={submission.name}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                <Dumbbell size={28} className="text-slate-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg text-slate-900 dark:text-white" data-testid={`submission-name-${submission.id}`}>
                                {submission.name}
                              </h3>
                              <div className="flex gap-2 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${getMuscleGroupStyle(submission.muscle)}`}>
                                  {MUSCLE_GROUPS.find((g) => g.id === submission.muscle)?.name || submission.muscle}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                  {EXERCISE_TYPES.find((t) => t.id === submission.type)?.name || submission.type}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 line-clamp-2">
                                {submission.technique}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => rejectSubmissionMutation.mutate({ id: submission.id })}
                                className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700"
                                data-testid={`button-reject-${submission.id}`}
                              >
                                <XIcon size={16} className="mr-1" />
                                Отклонить
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => approveSubmissionMutation.mutate({ id: submission.id })}
                                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
                                data-testid={`button-approve-${submission.id}`}
                              >
                                <Check size={16} className="mr-1" />
                                Одобрить
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
