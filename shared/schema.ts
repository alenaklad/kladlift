import { z } from "zod";
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  real,
  text,
} from "drizzle-orm/pg-core";

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

// ========== DATABASE TABLES (Drizzle ORM) ==========

// Session storage table for Replit Auth
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default('user'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Registration schema for validation
export const registerSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Login schema for validation
export const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});

// --- EXERCISE DATABASE TABLES ---

// Custom exercises (public database - managed by admins)
export const customExercises = pgTable("custom_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  muscle: varchar("muscle").notNull(),
  type: varchar("type").notNull(),
  technique: text("technique").notNull(),
  workingMuscles: text("working_muscles"),
  imageUrl: varchar("image_url"),
  videoUrl: varchar("video_url"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertCustomExercise = typeof customExercises.$inferInsert;
export type SelectCustomExercise = typeof customExercises.$inferSelect;

// User-created exercises (private or pending approval)
export const userExercises = pgTable("user_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  muscle: varchar("muscle").notNull(),
  type: varchar("type").notNull(),
  technique: text("technique").notNull(),
  workingMuscles: text("working_muscles"),
  imageUrl: varchar("image_url"),
  videoUrl: varchar("video_url"),
  visibility: varchar("visibility").default('private'),
  status: varchar("status").default('active'),
  submittedAt: timestamp("submitted_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  approvedExerciseId: varchar("approved_exercise_id").references(() => customExercises.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertUserExercise = typeof userExercises.$inferInsert;
export type SelectUserExercise = typeof userExercises.$inferSelect;

// Media assets (photos/videos for exercises)
export const mediaAssets = pgTable("media_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(),
  url: varchar("url").notNull(),
  filename: varchar("filename"),
  mimeType: varchar("mime_type"),
  size: integer("size"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Profile (training settings) linked to user
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  gender: varchar("gender").notNull(),
  age: integer("age").notNull(),
  height: integer("height").notNull(),
  weight: real("weight").notNull(),
  fat: real("fat"),
  experienceYears: real("experience_years").notNull(),
  sleep: real("sleep").default(7),
  stress: varchar("stress").default('moderate'),
  calories: varchar("calories").default('maintenance'),
  goal: varchar("goal").default('hypertrophy'),
  trainingDays: integer("training_days").default(3),
  priorityMuscles: text("priority_muscles").array(),
  cycleLastPeriod: varchar("cycle_last_period"),
  cycleLength: integer("cycle_length"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type SelectUserProfile = typeof userProfiles.$inferSelect;

// Workouts table linked to user
export const workouts = pgTable("workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  exercises: jsonb("exercises").notNull().$type<WorkoutExercise[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertWorkout = typeof workouts.$inferInsert;
export type SelectWorkout = typeof workouts.$inferSelect;

// Body Logs table linked to user
export const bodyLogs = pgTable("body_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  weight: real("weight").notNull(),
  fat: real("fat"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertBodyLog = typeof bodyLogs.$inferInsert;
export type SelectBodyLog = typeof bodyLogs.$inferSelect;

// Workout Templates table linked to user
export const workoutTemplates = pgTable("workout_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  exercises: jsonb("exercises").notNull().$type<WorkoutExercise[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertWorkoutTemplate = typeof workoutTemplates.$inferInsert;
export type SelectWorkoutTemplate = typeof workoutTemplates.$inferSelect;

// ========== ZOD SCHEMAS (for validation) ==========

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

// --- Cardio Exercise Types ---
export const CARDIO_TYPES = {
  hiit: { 
    label: 'HIIT', 
    fields: ['duration'],
    exercises: ['hiit_gen']
  },
  distance: { 
    label: 'Дистанция', 
    fields: ['duration', 'distance'],
    exercises: ['run_tread', 'run_outdoor', 'bike_outdoor', 'bike_stat', 'row_erg', 'swimming', 'elliptical']
  },
  stepper: { 
    label: 'Степпер', 
    fields: ['duration', 'steps'],
    exercises: ['stair_climber']
  },
  jumprope: { 
    label: 'Скакалка', 
    fields: ['duration', 'jumps'],
    exercises: ['jump_rope']
  }
} as const;

export type CardioType = keyof typeof CARDIO_TYPES;

// Helper to get cardio type by exercise id
export function getCardioType(exerciseId: string): CardioType | null {
  for (const [type, config] of Object.entries(CARDIO_TYPES)) {
    if ((config.exercises as readonly string[]).includes(exerciseId)) {
      return type as CardioType;
    }
  }
  return null;
}

// --- Exercise ---
export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  type: 'compound' | 'isolation';
  technique: string;
  cardioType?: CardioType;
}

// --- Set (supports both strength and cardio) ---
export const setSchema = z.object({
  // Strength training fields
  weight: z.number().min(0).optional(),
  reps: z.number().min(0).optional(),
  // Cardio fields
  duration: z.number().min(0).optional(), // minutes
  distance: z.number().min(0).optional(), // km or miles
  distanceUnit: z.enum(['km', 'mi']).optional(),
  steps: z.number().min(0).optional(), // for stepper
  jumps: z.number().min(0).optional() // for jump rope
});

export type SetData = z.infer<typeof setSchema>;

// --- Workout Exercise ---
export const workoutExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  muscle: z.string(),
  sets: z.array(setSchema),
  cardioType: z.string().optional()
});

export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;

// --- Workout ---
export const workoutSchema = z.object({
  id: z.string(),
  date: z.number(),
  exercises: z.array(workoutExerciseSchema)
});

export type Workout = z.infer<typeof workoutSchema>;

// --- Workout Template ---
export const workoutTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  exercises: z.array(workoutExerciseSchema)
});

export type WorkoutTemplate = z.infer<typeof workoutTemplateSchema>;

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
