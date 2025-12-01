import { useState, useEffect } from "react";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart2, 
  Dumbbell, 
  MessageCircle, 
  Home,
  LogOut,
  User as UserIcon,
  Shield,
  PlusCircle
} from "lucide-react";
import type { UserProfile, Workout, BodyLog, WorkoutExercise, User } from "@shared/schema";

import { Onboarding } from "@/components/Onboarding";
import { Dashboard } from "@/components/Dashboard";
import { WorkoutLogger } from "@/components/WorkoutLogger";
import { Progress } from "@/components/Progress";
import { CoachView } from "@/components/CoachView";
import { HistoryView } from "@/components/HistoryView";
import { AdminPanel } from "@/components/AdminPanel";
import { UserExerciseCreator } from "@/components/UserExerciseCreator";
import { AuthForms } from "@/components/AuthForms";
import { CycleView } from "@/components/CycleView";

type AppView = 'dashboard' | 'log' | 'progress' | 'coach' | 'history' | 'admin' | 'my-exercises' | 'cycle';

function CalibrationView() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-slate-900 text-white">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-t-4 border-white rounded-full animate-spin"></div>
        <div className="absolute inset-3 border-b-4 border-white/30 rounded-full animate-spin-reverse"></div>
      </div>
      <h3 className="text-2xl font-bold mb-2 animate-pulse">Калибровка...</h3>
      <p className="text-white/60 text-sm">Рассчитываем MRV и MEV нагрузки</p>
    </div>
  );
}

function AuthenticatedApp() {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [view, setView] = useState<AppView>('dashboard');
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    enabled: !!authUser,
    retry: false
  });

  const isAdmin = currentUser?.role === 'admin';

  const { data: userProfile, isLoading: userLoading, refetch: refetchUser } = useQuery<UserProfile | null>({
    queryKey: ['/api/user'],
  });

  const { data: workouts = [], refetch: refetchWorkouts } = useQuery<Workout[]>({
    queryKey: ['/api/workouts'],
    enabled: isOnboarded === true,
  });

  const { data: bodyLogs = [], refetch: refetchBodyLogs } = useQuery<BodyLog[]>({
    queryKey: ['/api/body-logs'],
    enabled: isOnboarded === true,
  });

  const saveUserMutation = useMutation({
    mutationFn: (userData: UserProfile) => apiRequest('POST', '/api/user', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    }
  });

  const saveWorkoutMutation = useMutation({
    mutationFn: (workout: Omit<Workout, 'id'>) => apiRequest('POST', '/api/workouts', workout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      toast({
        title: "Тренировка сохранена",
        description: "Отличная работа!"
      });
    }
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/workouts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      toast({
        title: "Тренировка удалена",
      });
    }
  });

  const addBodyLogMutation = useMutation({
    mutationFn: (log: Omit<BodyLog, 'id'>) => apiRequest('POST', '/api/body-logs', log),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/body-logs'] });
      toast({
        title: "Замер сохранен",
      });
    }
  });

  const deleteBodyLogMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/body-logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/body-logs'] });
    }
  });

  useEffect(() => {
    if (!userLoading) {
      setIsOnboarded(!!userProfile);
    }
  }, [userProfile, userLoading]);

  const handleOnboardingComplete = async (userData: UserProfile, shouldLogInitial: boolean) => {
    setIsCalibrating(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await saveUserMutation.mutateAsync(userData);
    await refetchUser();
    
    setIsCalibrating(false);
    setIsOnboarded(true);
    
    if (shouldLogInitial) {
      setView('log');
    }
  };

  const handleSaveWorkout = async (exercises: WorkoutExercise[], date: number) => {
    if (editingWorkout) {
      await apiRequest('PATCH', `/api/workouts/${editingWorkout.id}`, { exercises, date });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      toast({
        title: "Тренировка обновлена",
        description: "Изменения сохранены"
      });
    } else {
      const workout: Omit<Workout, 'id'> = {
        date,
        exercises
      };
      await saveWorkoutMutation.mutateAsync(workout);
    }
    setView('dashboard');
    setEditingWorkout(null);
  };

  const handleUpdateBody = async (weight: number, fat: number | undefined, date: number) => {
    const log: Omit<BodyLog, 'id'> = {
      date,
      weight,
      fat
    };
    await addBodyLogMutation.mutateAsync(log);

    if (userProfile) {
      await saveUserMutation.mutateAsync({
        ...userProfile,
        weight,
        fat
      });
    }
  };

  if (userLoading || isOnboarded === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isCalibrating) {
    return <CalibrationView />;
  }

  if (!isOnboarded || !userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (view === 'log') {
    return (
      <WorkoutLogger 
        onSave={handleSaveWorkout}
        onCancel={() => {
          setView('dashboard');
          setEditingWorkout(null);
        }}
        initialExercises={editingWorkout?.exercises}
        initialDate={editingWorkout?.date}
      />
    );
  }

  if (view === 'coach') {
    return (
      <CoachView 
        user={userProfile} 
        workouts={workouts} 
        onBack={() => setView('dashboard')} 
      />
    );
  }

  if (view === 'history') {
    return (
      <HistoryView 
        workouts={workouts}
        onEdit={(workout) => {
          setEditingWorkout(workout);
          setView('log');
        }}
        onDelete={(id) => deleteWorkoutMutation.mutate(id)}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'admin' && isAdmin) {
    return <AdminPanel onBack={() => setView('dashboard')} />;
  }

  if (view === 'my-exercises') {
    return <UserExerciseCreator onBack={() => setView('dashboard')} />;
  }

  if (view === 'cycle') {
    return <CycleView user={userProfile} onBack={() => setView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* User header with logout */}
      <div className="fixed top-0 right-0 p-4 z-50 flex items-center gap-3">
        {authUser && (
          <>
            <button
              onClick={() => setView('my-exercises')}
              className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
              data-testid="button-my-exercises"
              title="Мои упражнения"
            >
              <PlusCircle size={18} />
            </button>
            {isAdmin && (
              <button
                onClick={() => setView('admin')}
                className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
                data-testid="button-admin-panel"
                title="Админ-панель"
              >
                <Shield size={18} />
              </button>
            )}
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              {authUser.profileImageUrl ? (
                <img 
                  src={authUser.profileImageUrl} 
                  alt="" 
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
                  <UserIcon size={16} className="text-slate-500" />
                </div>
              )}
              <span className="hidden sm:block font-medium">{authUser.firstName || authUser.email}</span>
            </div>
            <button
              onClick={async () => {
                try {
                  await apiRequest('POST', '/api/auth/logout');
                  queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
                } catch (error) {
                  console.error('Logout failed:', error);
                }
              }}
              className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm"
              data-testid="button-logout"
              title="Выйти"
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>

      {view === 'dashboard' && (
        <Dashboard 
          user={userProfile}
          workouts={workouts}
          bodyLogs={bodyLogs}
          onLogClick={() => setView('log')}
          onUpdateBody={handleUpdateBody}
          onDeleteBodyLog={(id) => deleteBodyLogMutation.mutate(id)}
          onOpenHistory={() => setView('history')}
          onOpenCoach={() => setView('coach')}
          onOpenCycle={() => setView('cycle')}
        />
      )}
      
      {view === 'progress' && (
        <Progress 
          workouts={workouts} 
          userCycle={userProfile.cycle} 
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 pb-safe z-50 shadow-lg">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'dashboard' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
            data-testid="nav-dashboard"
          >
            <Home size={24} />
            <span className="text-xs font-medium">Главная</span>
          </button>
          <button 
            onClick={() => setView('log')}
            className="flex flex-col items-center gap-1 transition-colors text-slate-400 hover:text-slate-600"
            data-testid="nav-log"
          >
            <Dumbbell size={24} />
            <span className="text-xs font-medium">Запись</span>
          </button>
          <button 
            onClick={() => setView('progress')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'progress' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
            data-testid="nav-progress"
          >
            <BarChart2 size={24} />
            <span className="text-xs font-medium">Прогресс</span>
          </button>
          <button 
            onClick={() => setView('coach')}
            className="flex flex-col items-center gap-1 transition-colors text-slate-400 hover:text-slate-600"
            data-testid="nav-coach"
          >
            <MessageCircle size={24} />
            <span className="text-xs font-medium">Тренер</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForms onSuccess={() => queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] })} />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppRouter />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
