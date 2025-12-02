import { useState, useEffect } from "react";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart2, 
  Plus,
  Brain,
  Home
} from "lucide-react";
import type { UserProfile, Workout, BodyLog, WorkoutExercise, User } from "@shared/schema";

import { Onboarding } from "@/components/Onboarding";
import { Dashboard } from "@/components/Dashboard";
import { WorkoutLogger } from "@/components/WorkoutLogger";
import { Progress } from "@/components/Progress";
import { CoachView } from "@/components/CoachView";
import { HistoryView } from "@/components/HistoryView";
import { AdminPanel } from "@/components/AdminPanel";
import { AuthForms } from "@/components/AuthForms";
import { CycleView } from "@/components/CycleView";
import { GoalDetailsView } from "@/components/GoalDetailsView";
import { UserMenu } from "@/components/UserMenu";
import { ProfileView } from "@/components/ProfileView";

type AppView = 'dashboard' | 'log' | 'progress' | 'coach' | 'history' | 'admin' | 'cycle' | 'goal' | 'profile';

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

  if (view === 'cycle') {
    return (
      <CycleView 
        user={userProfile} 
        onBack={() => setView('dashboard')} 
        onUpdatePeriod={async (date: string) => {
          if (userProfile.cycle) {
            await saveUserMutation.mutateAsync({
              ...userProfile,
              cycle: {
                ...userProfile.cycle,
                lastPeriod: date
              }
            });
            toast({
              title: "Цикл обновлён",
              description: "Дата начала месячных сохранена"
            });
          }
        }}
      />
    );
  }

  if (view === 'goal') {
    return <GoalDetailsView user={userProfile} onBack={() => setView('dashboard')} />;
  }

  if (view === 'profile') {
    return (
      <ProfileView 
        user={userProfile}
        onBack={() => setView('dashboard')}
        onSave={async (data) => {
          await saveUserMutation.mutateAsync({
            ...userProfile,
            ...data
          });
          toast({
            title: "Профиль обновлён",
            description: "Настройки успешно сохранены"
          });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* User header with UserMenu */}
      <div className="fixed top-0 right-0 p-4 z-50">
        {authUser && currentUser && (
          <UserMenu
            user={currentUser}
            profile={userProfile}
            isAdmin={isAdmin}
            onOpenAdmin={() => setView('admin')}
            onOpenProfile={() => setView('profile')}
          />
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
          onOpenGoal={() => setView('goal')}
        />
      )}
      
      {view === 'progress' && (
        <Progress 
          workouts={workouts} 
          userCycle={userProfile.cycle} 
        />
      )}

      {/* Floating pill navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-lg rounded-full px-3 py-2 shadow-2xl border border-slate-200/50">
          <button 
            onClick={() => setView('dashboard')}
            className={`p-3 rounded-full transition-all ${view === 'dashboard' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            data-testid="nav-dashboard"
            title="Главная"
          >
            <Home size={22} />
          </button>
          <button 
            onClick={() => setView('coach')}
            className={`p-3 rounded-full transition-all ${(view as AppView) === 'coach' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            data-testid="nav-coach"
            title="AI Тренер"
          >
            <Brain size={22} />
          </button>
          <button 
            onClick={() => setView('log')}
            className="p-4 -my-1 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105 active:scale-95"
            data-testid="nav-log"
            title="Новая тренировка"
          >
            <Plus size={24} />
          </button>
          <button 
            onClick={() => setView('progress')}
            className={`p-3 rounded-full transition-all ${view === 'progress' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            data-testid="nav-progress"
            title="Прогресс"
          >
            <BarChart2 size={22} />
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
