import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowLeft, Loader2, ChevronRight, Sparkles, Activity, Target, TrendingUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const registerSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  confirmPassword: z.string().min(6, "Подтвердите пароль"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

interface AuthFormsProps {
  onSuccess: () => void;
}

export function AuthForms({ onSuccess }: AuthFormsProps) {
  const [mode, setMode] = useState<'landing' | 'login' | 'register'>('landing');
  const { toast } = useToast();

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: Omit<RegisterFormData, 'confirmPassword'>) => {
      const { confirmPassword, ...registerData } = data as RegisterFormData;
      return apiRequest('POST', '/api/auth/register', registerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: "Успешно!", description: "Аккаунт создан" });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка регистрации", 
        description: error.message || "Попробуйте еще раз",
        variant: "destructive"
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return apiRequest('POST', '/api/auth/login', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: "Добро пожаловать!" });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка входа", 
        description: error.message || "Неверный email или пароль",
        variant: "destructive"
      });
    },
  });

  const onRegisterSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  if (mode === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="KladLift" className="w-10 h-10 object-contain" />
              <span className="text-white/90 font-semibold text-lg tracking-tight">KladLift</span>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
            <div className="max-w-xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full mb-8">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white/70">AI-Powered Fitness</span>
              </div>

              {/* Main headline */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight mb-6">
                Тренируйся
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  умнее
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/60 mb-12 max-w-md mx-auto leading-relaxed">
                Персональный тренер с искусственным интеллектом. 
                Наука, адаптация, результат.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white/80">Персонализация</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white/80">Прогрессия</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white/80">AI Коучинг</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => setMode('register')}
                  className="group px-8 py-6 bg-white text-slate-900 hover:bg-white/90 rounded-2xl font-semibold text-lg shadow-2xl shadow-white/10 transition-all duration-300 hover:shadow-white/20 hover:scale-[1.02]"
                  data-testid="button-register"
                >
                  Начать бесплатно
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={() => setMode('login')}
                  variant="outline"
                  className="px-8 py-6 bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-2xl font-semibold text-lg transition-all duration-300"
                  data-testid="button-login"
                >
                  Войти
                </Button>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="p-6 text-center">
            <p className="text-white/30 text-sm">
              Присоединяйтесь к тысячам атлетов
            </p>
          </footer>
        </div>
      </div>
    );
  }

  if (mode === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
        {/* Left side - Form */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20">
          <div className="max-w-md mx-auto w-full">
            {/* Back button */}
            <button
              onClick={() => setMode('landing')}
              className="group flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8 transition-colors"
              data-testid="button-back"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Назад</span>
            </button>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Создать аккаунт
              </h1>
              <p className="text-slate-500">
                Начните свой путь к идеальной форме
              </p>
            </div>

            {/* Form */}
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <Input
                            {...field}
                            type="email"
                            placeholder="you@example.com"
                            className="pl-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={registerForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">Имя</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                              {...field}
                              placeholder="Иван"
                              className="pl-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                              data-testid="input-firstName"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">Фамилия</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Иванов"
                            className="h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                            data-testid="input-lastName"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Пароль</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Минимум 6 символов"
                            className="pl-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                            data-testid="input-password"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Подтвердите пароль</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Повторите пароль"
                            className="pl-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                            data-testid="input-confirmPassword"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold text-base shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40"
                  disabled={registerMutation.isPending}
                  data-testid="button-submit-register"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={20} />
                      Регистрация...
                    </>
                  ) : (
                    "Создать аккаунт"
                  )}
                </Button>

                <p className="text-center text-slate-500 text-sm pt-2">
                  Уже есть аккаунт?{" "}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                    data-testid="link-to-login"
                  >
                    Войти
                  </button>
                </p>
              </form>
            </Form>
          </div>
        </div>

        {/* Right side - Visual */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-40 left-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col justify-center p-16">
            <div className="max-w-md">
              <img src="/logo.png" alt="KladLift" className="w-20 h-20 object-contain mb-8" />
              <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
                Трансформируй своё тело
              </h2>
              <p className="text-white/70 text-lg leading-relaxed">
                Персонализированные программы тренировок, основанные на науке и адаптированные под ваши цели.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-40 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-16">
          <div className="max-w-md">
            <img src="/logo.png" alt="KladLift" className="w-20 h-20 object-contain mb-8" />
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
              С возвращением
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Продолжайте свой путь к совершенству. Каждая тренировка приближает вас к цели.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20">
        <div className="max-w-md mx-auto w-full">
          {/* Back button */}
          <button
            onClick={() => setMode('landing')}
            className="group flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8 transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Назад</span>
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Вход в аккаунт
            </h1>
            <p className="text-slate-500">
              Введите данные для входа в KladLift
            </p>
          </div>

          {/* Form */}
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@example.com"
                          className="pl-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Пароль</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          {...field}
                          type="password"
                          placeholder="Введите пароль"
                          className="pl-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                          data-testid="input-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold text-base shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40"
                disabled={loginMutation.isPending}
                data-testid="button-submit-login"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    Вход...
                  </>
                ) : (
                  "Войти"
                )}
              </Button>

              <p className="text-center text-slate-500 text-sm pt-2">
                Нет аккаунта?{" "}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                  data-testid="link-to-register"
                >
                  Зарегистрироваться
                </button>
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
