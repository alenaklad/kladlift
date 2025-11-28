import { useState, useEffect } from "react";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart2, 
  Dumbbell, 
  MessageCircle, 
  Home 
} from "lucide-react";
import type { UserProfile, Workout, BodyLog, WorkoutExercise } from "@shared/schema";

import { Onboarding } from "@/components/Onboarding";
import { Dashboard } from "@/components/Dashboard";
import { WorkoutLogger } from "@/components/WorkoutLogger";
import { Progress } from "@/components/Progress";
import { CoachView } from "@/components/CoachView";
import { HistoryView } from "@/components/HistoryView";

type AppView = 'dashboard' | 'log' | 'progress' | 'coach' | 'history';

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

function FitnessApp() {
  const { toast } = useToast();
  const [view, setView] = useState<AppView>('dashboard');
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const { data: user, isLoading: userLoading, refetch: refetchUser } = useQuery<UserProfile | null>({
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
      setIsOnboarded(!!user);
    }
  }, [user, userLoading]);

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

    if (user) {
      await saveUserMutation.mutateAsync({
        ...user,
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

  if (!isOnboarded || !user) {
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
        user={user} 
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
      {view === 'dashboard' && (
        <Dashboard 
          user={user}
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
          userCycle={user.cycle} 
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FitnessApp />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
