import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
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

          <div className="w-full max-w-sm space-y-4">
            <Button
              onClick={() => setMode('login')}
              className="w-full py-6 bg-white text-[#0A0E1A] rounded-2xl font-bold text-xl hover:bg-gray-100 transition-colors"
              data-testid="button-login"
            >
              Войти
            </Button>
            <Button
              onClick={() => setMode('register')}
              variant="outline"
              className="w-full py-6 rounded-2xl font-bold text-xl border-white/20 hover:bg-white/10"
              data-testid="button-register"
            >
              Зарегистрироваться
            </Button>
          </div>
          
          <p className="text-gray-500 text-sm mt-6 text-center">
            Создайте аккаунт или войдите, чтобы начать
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'register') {
    return (
      <div className="min-h-screen bg-[#0A0E1A] text-white flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[#111827] border-white/10">
          <CardHeader className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode('landing')}
              className="w-fit -ml-2 text-gray-400 hover:text-white"
              data-testid="button-back"
            >
              <ArrowLeft size={16} className="mr-2" />
              Назад
            </Button>
            <div>
              <CardTitle className="text-2xl text-white">Регистрация</CardTitle>
              <CardDescription className="text-gray-400">
                Создайте аккаунт для использования KladLift
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                          <Input
                            {...field}
                            type="email"
                            placeholder="email@example.com"
                            className="pl-10 bg-[#1A1F2E] border-white/10 text-white placeholder:text-gray-500"
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={registerForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Имя</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <Input
                              {...field}
                              placeholder="Иван"
                              className="pl-10 bg-[#1A1F2E] border-white/10 text-white placeholder:text-gray-500"
                              data-testid="input-firstName"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Фамилия</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Иванов"
                            className="bg-[#1A1F2E] border-white/10 text-white placeholder:text-gray-500"
                            data-testid="input-lastName"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Пароль</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Минимум 6 символов"
                            className="pl-10 bg-[#1A1F2E] border-white/10 text-white placeholder:text-gray-500"
                            data-testid="input-password"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Подтвердите пароль</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Повторите пароль"
                            className="pl-10 bg-[#1A1F2E] border-white/10 text-white placeholder:text-gray-500"
                            data-testid="input-confirmPassword"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full py-6 bg-white text-[#0A0E1A] rounded-xl font-bold text-lg hover:bg-gray-100"
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

                <p className="text-center text-gray-400 text-sm">
                  Уже есть аккаунт?{" "}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-white hover:underline"
                    data-testid="link-to-login"
                  >
                    Войти
                  </button>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md bg-[#111827] border-white/10">
        <CardHeader className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('landing')}
            className="w-fit -ml-2 text-gray-400 hover:text-white"
            data-testid="button-back"
          >
            <ArrowLeft size={16} className="mr-2" />
            Назад
          </Button>
          <div>
            <CardTitle className="text-2xl text-white">Вход</CardTitle>
            <CardDescription className="text-gray-400">
              Войдите в свой аккаунт KladLift
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <Input
                          {...field}
                          type="email"
                          placeholder="email@example.com"
                          className="pl-10 bg-[#1A1F2E] border-white/10 text-white placeholder:text-gray-500"
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Пароль</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <Input
                          {...field}
                          type="password"
                          placeholder="Введите пароль"
                          className="pl-10 bg-[#1A1F2E] border-white/10 text-white placeholder:text-gray-500"
                          data-testid="input-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full py-6 bg-white text-[#0A0E1A] rounded-xl font-bold text-lg hover:bg-gray-100"
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

              <p className="text-center text-gray-400 text-sm">
                Нет аккаунта?{" "}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-white hover:underline"
                  data-testid="link-to-register"
                >
                  Зарегистрироваться
                </button>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
