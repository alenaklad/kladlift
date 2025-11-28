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
  User as UserIcon
} from "lucide-react";
import type { UserProfile, Workout, BodyLog, WorkoutExercise } from "@shared/schema";

import { Onboarding } from "@/components/Onboarding";
import { Dashboard } from "@/components/Dashboard";
import { WorkoutLogger } from "@/components/WorkoutLogger";
import { Progress } from "@/components/Progress";
import { CoachView } from "@/components/CoachView";
import { HistoryView } from "@/components/HistoryView";

type AppView = 'dashboard' | 'log' | 'progress' | 'coach' | 'history';

function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-8">
          <div className="absolute -inset-8 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <Dumbbell size={48} className="text-[#0A0E1A]" />
          </div>
        </div>
        
        <h1 className="text-5xl font-black tracking-tight mb-4 text-center">
          KladLift
        </h1>
        
        <p className="text-xl text-gray-400 text-center mb-8 max-w-md">
          Персональный тренировочный трекер с AI-коучингом и научным подходом
        </p>

        <div className="space-y-4 mb-12 text-center">
          <div className="flex items-center gap-3 text-gray-300">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Персонализированные программы тренировок</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>AI-тренер для техники и мотивации</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Синхронизация на всех устройствах</span>
          </div>
        </div>

        <a
          href="/api/login"
          className="w-full max-w-sm py-5 bg-white text-[#0A0E1A] rounded-2xl font-bold text-xl text-center shadow-2xl hover:bg-gray-100 transition-colors block"
          data-testid="button-login"
        >
          Войти
        </a>
        
        <p className="text-gray-500 text-sm mt-6 text-center">
          Войдите через Google, GitHub или email
        </p>
      </div>

      <footer className="p-6 text-center text-gray-600 text-sm">
        Безопасно храним ваши данные
      </footer>
    </div>
  );
}

function CalibrationView() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-t-4 border-white rounded-full animate-spin"></div>
        <div className="absolute inset-3 border-b-4 border-white/30 rounded-full animate-spin-reverse"></div>
      </div>
      <h3 className="text-2xl font-bold mb-2 animate-pulse">Калибровка...</h3>
      <p className="text-gray-500 text-sm">Рассчитываем MRV и MEV нагрузки</p>
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

  const handleSaveWorkout = async (exercises: WorkoutExercise[]) => {
    const workout: Omit<Workout, 'id'> = {
      date: Date.now(),
      exercises
    };
    
    await saveWorkoutMutation.mutateAsync(workout);
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
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      {/* User header with logout */}
      <div className="fixed top-0 right-0 p-4 z-50 flex items-center gap-3">
        {authUser && (
          <>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              {authUser.profileImageUrl ? (
                <img 
                  src={authUser.profileImageUrl} 
                  alt="" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-[#1A1F2E] rounded-full flex items-center justify-center">
                  <UserIcon size={16} />
                </div>
              )}
              <span className="hidden sm:block">{authUser.firstName || authUser.email}</span>
            </div>
            <a
              href="/api/logout"
              className="p-2 bg-[#1A1F2E] rounded-full text-gray-400 hover:text-white hover:bg-[#252A3A] transition-colors"
              data-testid="button-logout"
              title="Выйти"
            >
              <LogOut size={18} />
            </a>
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
          onOpenCycle={() => {}}
        />
      )}
      
      {view === 'progress' && (
        <Progress 
          workouts={workouts} 
          userCycle={userProfile.cycle} 
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-white/5 px-6 py-4 pb-safe z-50">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-white' : 'text-gray-500'}`}
            data-testid="nav-dashboard"
          >
            <Home size={24} />
            <span className="text-xs font-medium">Главная</span>
          </button>
          <button 
            onClick={() => setView('log')}
            className={`flex flex-col items-center gap-1 ${view === 'log' ? 'text-white' : 'text-gray-500'}`}
            data-testid="nav-log"
          >
            <Dumbbell size={24} />
            <span className="text-xs font-medium">Запись</span>
          </button>
          <button 
            onClick={() => setView('progress')}
            className={`flex flex-col items-center gap-1 ${view === 'progress' ? 'text-white' : 'text-gray-500'}`}
            data-testid="nav-progress"
          >
            <BarChart2 size={24} />
            <span className="text-xs font-medium">Прогресс</span>
          </button>
          <button 
            onClick={() => setView('coach')}
            className={`flex flex-col items-center gap-1 ${view === 'coach' ? 'text-white' : 'text-gray-500'}`}
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
      <div className="flex items-center justify-center h-screen bg-[#0A0E1A]">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
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
