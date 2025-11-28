import { z } from "zod";

// --- CONSTANTS ---
export const GOALS = {
  hypertrophy: { label: 'Эстетика и гипертрофия', description: 'Максимальный мышечный объем и пропорции.', repRange: '8-12', restMinutes: '1.5-2', volumeMod: 1.0 },
  strength: { label: 'Абсолютная сила', description: 'Подъем максимальных весов. Нейральная эффективность.', repRange: '3-5', restMinutes: '3-5', volumeMod: 0.7 },
  endurance: { label: 'Выносливость и рельеф', description: 'Функциональность, тонус, сжигание калорий и похудение.', repRange: '15-20', restMinutes: '0.5-1', volumeMod: 1.2 }
} as const;

export const STRESS_LEVELS = {
  low: { label: 'Низкий', val: 1.1, desc: 'Жизнь спокойна, у меня много сил.' },
  moderate: { label: 'Средний', val: 1.0, desc: 'Обычный ритм, бывают дедлайны.' },
  high: { label: 'Высокий', val: 0.85, desc: 'Много работы, нервов или недосыпа.' }
} as const;

export const CALORIES_OPTS = {
  surplus: { label: 'Профицит (Масса)', val: 1.1 },
  maintenance: { label: 'Поддержка (Рекомпозиция)', val: 1.0 },
  deficit: { label: 'Дефицит (Сушка)', val: 0.85 }
} as const;

export const MUSCLE_GROUPS = {
  legs: { label: 'Ноги', color: '#34C759', bg: '#E8F5E9', text: '#1B5E20', image: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=800&auto=format&fit=crop&q=60' },
  back: { label: 'Спина', color: '#007AFF', bg: '#E3F2FD', text: '#0D47A1', image: 'https://images.unsplash.com/photo-1603287681836-d174d7a63381?w=800&auto=format&fit=crop&q=60' },
  chest: { label: 'Грудь', color: '#FF2D55', bg: '#FFEBEE', text: '#B71C1C', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=60' },
  shoulders: { label: 'Плечи', color: '#FF9500', bg: '#FFF3E0', text: '#E65100', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=60' },
  arms: { label: 'Руки', color: '#AF52DE', bg: '#F3E5F5', text: '#4A148C', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=60' },
  abs: { label: 'Кор', color: '#8E8E93', bg: '#F5F5F5', text: '#424242', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=60' },
  cardio: { label: 'Кардио', color: '#FF3B30', bg: '#FFEBEE', text: '#C62828', image: 'https://images.unsplash.com/photo-1538805060512-e2c9dc99e9e0?w=800&auto=format&fit=crop&q=60' }
} as const;

export type MuscleGroup = keyof typeof MUSCLE_GROUPS;
export type Goal = keyof typeof GOALS;
export type StressLevel = keyof typeof STRESS_LEVELS;
export type CaloriesOption = keyof typeof CALORIES_OPTS;

// --- Cycle Phase Types ---
export interface CyclePhase {
  id: string;
  name: string;
  color: string;
  bg: string;
  desc: string;
  rec: string;
  guidance: {
    sleep: string;
    strain: string;
    stress: string;
  };
  day: number;
}

// --- User Profile ---
export const cycleDataSchema = z.object({
  lastPeriod: z.string(),
  length: z.number().default(28)
});

export const userProfileSchema = z.object({
  id: z.string().optional(),
  gender: z.enum(['male', 'female']),
  age: z.number().min(10).max(100),
  height: z.number().min(100).max(250),
  weight: z.number().min(30).max(300),
  fat: z.number().optional(),
  experienceYears: z.number().min(0).max(50),
  sleep: z.number().min(4).max(12).default(7),
  stress: z.enum(['low', 'moderate', 'high']).default('moderate'),
  calories: z.enum(['surplus', 'maintenance', 'deficit']).default('maintenance'),
  goal: z.enum(['hypertrophy', 'strength', 'endurance']).default('hypertrophy'),
  trainingDays: z.number().min(1).max(7).default(3),
  priorityMuscles: z.array(z.string()).default([]),
  cycle: cycleDataSchema.optional()
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type CycleData = z.infer<typeof cycleDataSchema>;

// --- Exercise ---
export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  type: 'compound' | 'isolation';
  technique: string;
}

// --- Set ---
export const setSchema = z.object({
  weight: z.number().min(0),
  reps: z.number().min(0)
});

export type SetData = z.infer<typeof setSchema>;

// --- Workout Exercise ---
export const workoutExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  muscle: z.string(),
  sets: z.array(setSchema)
});

export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;

// --- Workout ---
export const workoutSchema = z.object({
  id: z.string(),
  date: z.number(),
  exercises: z.array(workoutExerciseSchema)
});

export type Workout = z.infer<typeof workoutSchema>;

// --- Body Log ---
export const bodyLogSchema = z.object({
  id: z.string(),
  date: z.number(),
  weight: z.number(),
  fat: z.number().optional()
});

export type BodyLog = z.infer<typeof bodyLogSchema>;

// --- Chat Message ---
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string(),
  image: z.string().optional()
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// --- Coach Personas ---
export const COACH_PERSONAS = {
  training: { 
    id: 'training',
    name: 'Тренер', 
    desc: 'Программирование, техника, объем нагрузки.',
    systemPrompt: 'Ты — опытный персональный тренер. Помогаешь с техникой, программированием тренировок, подбором упражнений. Отвечай кратко и по делу на русском языке.'
  },
  nutrition: { 
    id: 'nutrition',
    name: 'Нутрициолог', 
    desc: 'Калории, макросы, режим питания.',
    systemPrompt: 'Ты — квалифицированный нутрициолог. Помогаешь с питанием, подсчетом калорий, макросов. Можешь анализировать фото еды. Отвечай кратко на русском.'
  },
  motivation: { 
    id: 'motivation',
    name: 'Мотиватор', 
    desc: 'Фокус, дисциплина, ментальные блоки.',
    systemPrompt: 'Ты — спортивный психолог и мотиватор. Помогаешь с мотивацией, дисциплиной, преодолением ментальных барьеров. Вдохновляй и поддерживай на русском языке.'
  },
  recovery: { 
    id: 'recovery',
    name: 'Восстановление', 
    desc: 'Сон, стресс, регенерация.',
    systemPrompt: 'Ты — эксперт по восстановлению и регенерации. Консультируешь по сну, управлению стрессом, восстановлению после тренировок. Отвечай на русском.'
  }
} as const;

export type CoachPersonaId = keyof typeof COACH_PERSONAS;

// --- Program Calculation Types ---
export interface TrainingParams {
  repRange: string;
  restMinutes: string;
  goalDescription: string;
}

export interface ProgramMeta {
  standardSets: number;
  recoveryMultiplier: number;
  totalWeeklySets: number;
}

export interface CalculatedProgram {
  weeklyVolume: Record<string, number>;
  perDay: Record<string, string>;
  trainingParams: TrainingParams;
  meta: ProgramMeta;
}
