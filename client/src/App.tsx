import { useState, useEffect, useRef, useCallback } from "react";
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
  Home,
  Undo2
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
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

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

interface PendingDelete {
  workout: Workout;
  timeoutId: ReturnType<typeof setTimeout>;
  startTime: number;
}

function UndoDeleteToast({ 
  pendingDeletes, 
  onUndo 
}: { 
  pendingDeletes: Map<string, PendingDelete>; 
  onUndo: (id: string) => void 
}) {
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 100);
    return () => clearInterval(interval);
  }, []);
  
  const entries = Array.from(pendingDeletes.entries());
  if (entries.length === 0) return null;
  
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {entries.map(([workoutId, pending]) => {
        const elapsed = Date.now() - pending.startTime;
        const remaining = Math.max(0, 10000 - elapsed);
        const progress = (remaining / 10000) * 100;
        
        return (
          <div 
            key={workoutId}
            className="bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[280px] animate-slideUp"
          >
            <div className="relative w-10 h-10 flex-shrink-0">
              <svg className="w-10 h-10 -rotate-90">
                <circle 
                  cx="20" 
                  cy="20" 
                  r="18" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.2)" 
                  strokeWidth="3"
                />
                <circle 
                  cx="20" 
                  cy="20" 
                  r="18" 
                  fill="none" 
                  stroke="#a855f7" 
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-100"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {Math.ceil(remaining / 1000)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Тренировка удалена</p>
              <p className="text-xs text-slate-400 truncate">
                {pending.workout.exercises.length} упр.
              </p>
            </div>
            <button
              onClick={() => onUndo(workoutId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors"
              data-testid={`button-undo-delete-${workoutId}`}
            >
              <Undo2 size={14} />
              Отменить
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AuthenticatedApp() {
  const { toast, dismiss } = useToast();
  const { user: authUser } = useAuth();
  const [view, setView] = useState<AppView>('dashboard');
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<Map<string, PendingDelete>>(new Map());
  const pendingDeletesRef = useRef<Map<string, PendingDelete>>(new Map());

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
    }
  });

  const cancelPendingDelete = useCallback((workoutId: string) => {
    const pending = pendingDeletesRef.current.get(workoutId);
    if (pending) {
      clearTimeout(pending.timeoutId);
      pendingDeletesRef.current.delete(workoutId);
      setPendingDeletes(new Map(pendingDeletesRef.current));
      toast({
        title: "Удаление отменено",
        description: "Тренировка восстановлена",
      });
    }
  }, [toast]);

  const initiateDelete = useCallback((workout: Workout) => {
    const workoutId = workout.id;
    
    if (pendingDeletesRef.current.has(workoutId)) {
      return;
    }
    
    const startTime = Date.now();
    const UNDO_TIMEOUT = 10000;
    
    const timeoutId = setTimeout(() => {
      pendingDeletesRef.current.delete(workoutId);
      setPendingDeletes(new Map(pendingDeletesRef.current));
      deleteWorkoutMutation.mutate(workoutId);
      toast({
        title: "Тренировка удалена",
      });
    }, UNDO_TIMEOUT);
    
    const pendingDelete: PendingDelete = {
      workout,
      timeoutId,
      startTime,
    };
    
    pendingDeletesRef.current.set(workoutId, pendingDelete);
    setPendingDeletes(new Map(pendingDeletesRef.current));
  }, [deleteWorkoutMutation, toast]);

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
    const visibleWorkouts = workouts.filter(w => !pendingDeletes.has(w.id));
    
    return (
      <>
        <HistoryView 
          workouts={visibleWorkouts}
          onEdit={(workout) => {
            setEditingWorkout(workout);
            setView('log');
          }}
          onDelete={(id) => {
            const workout = workouts.find(w => w.id === id);
            if (workout) {
              initiateDelete(workout);
            }
          }}
          onBack={() => setView('dashboard')}
          onUpdateWorkout={async (workout) => {
            await apiRequest('PATCH', `/api/workouts/${workout.id}`, { 
              exercises: workout.exercises, 
              date: workout.date 
            });
            queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
            toast({
              title: "Тренировка обновлена",
              description: "Изменения сохранены"
            });
          }}
          onRepeatWorkout={(workout) => {
            setEditingWorkout({
              ...workout,
              id: '',
              date: Date.now(),
            });
            setView('log');
          }}
        />
        {pendingDeletes.size > 0 && (
          <UndoDeleteToast 
            pendingDeletes={pendingDeletes} 
            onUndo={cancelPendingDelete}
          />
        )}
      </>
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-end px-4 gap-2">
        <ThemeToggle />
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

      {/* Mobile-optimized bottom navigation with safe-area */}
      <nav className="fixed safe-bottom left-1/2 -translate-x-1/2 z-50 pb-safe">
        <div className="flex items-center gap-1 sm:gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl sm:rounded-full px-2 sm:px-3 py-2 shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center justify-center touch-target px-3 py-2 rounded-xl sm:rounded-full transition-all ${view === 'dashboard' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            data-testid="nav-dashboard"
          >
            <Home size={22} />
            <span className="text-[10px] font-medium mt-0.5 sm:hidden">Главная</span>
          </button>
          <button 
            onClick={() => setView('coach')}
            className={`flex flex-col items-center justify-center touch-target px-3 py-2 rounded-xl sm:rounded-full transition-all ${(view as AppView) === 'coach' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            data-testid="nav-coach"
          >
            <Brain size={22} />
            <span className="text-[10px] font-medium mt-0.5 sm:hidden">Тренер</span>
          </button>
          <button 
            onClick={() => setView('log')}
            className="flex items-center justify-center w-14 h-14 sm:w-12 sm:h-12 -my-1 rounded-2xl sm:rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105 active:scale-95"
            data-testid="nav-log"
          >
            <Plus size={26} />
          </button>
          <button 
            onClick={() => setView('progress')}
            className={`flex flex-col items-center justify-center touch-target px-3 py-2 rounded-xl sm:rounded-full transition-all ${view === 'progress' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            data-testid="nav-progress"
          >
            <BarChart2 size={22} />
            <span className="text-[10px] font-medium mt-0.5 sm:hidden">Прогресс</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-2xl shadow-purple-500/30">
          <svg 
            viewBox="0 0 24 24" 
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6.5 6.5a2 2 0 0 0-2.83 0L2.46 7.71a2 2 0 0 0 0 2.83l1.21 1.21" />
            <path d="M21.54 7.71a2 2 0 0 0 0-2.83l-1.21-1.21a2 2 0 0 0-2.83 0l-1.21 1.21" />
            <path d="M12 3v18" />
            <path d="M5 12h14" />
            <circle cx="5" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
            <path d="m2 2 20 20" className="opacity-0" />
          </svg>
        </div>
        <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-3xl blur-xl animate-pulse"></div>
      </div>
      
      <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">KladLift</h1>
      <p className="text-slate-400 text-sm mb-8">Персональный тренировочный трекер</p>
      
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthForms onSuccess={() => queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] })} />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppRouter />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
