import { 
  type UserProfile, 
  type Workout, 
  type BodyLog,
  type WorkoutTemplate,
  type User,
  type UpsertUser,
  type InsertCustomExercise,
  type SelectCustomExercise,
  type InsertUserExercise,
  type SelectUserExercise,
  type InsertWorkoutTemplate,
  type SelectWorkoutTemplate,
  users,
  userProfiles,
  workouts,
  bodyLogs,
  workoutTemplates,
  customExercises,
  userExercises
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: Omit<UpsertUser, 'id'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User Profile operations (scoped to user)
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  saveUserProfile(userId: string, profile: UserProfile): Promise<UserProfile>;
  
  // Workout operations (scoped to user)
  getWorkouts(userId: string): Promise<Workout[]>;
  getWorkout(userId: string, id: string): Promise<Workout | undefined>;
  addWorkout(userId: string, workout: Omit<Workout, 'id'>): Promise<Workout>;
  updateWorkout(userId: string, id: string, workout: Partial<Workout>): Promise<Workout | undefined>;
  deleteWorkout(userId: string, id: string): Promise<boolean>;
  
  // Body Log operations (scoped to user)
  getBodyLogs(userId: string): Promise<BodyLog[]>;
  addBodyLog(userId: string, log: Omit<BodyLog, 'id'>): Promise<BodyLog>;
  deleteBodyLog(userId: string, id: string): Promise<boolean>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getUserStats(): Promise<{ 
    totalUsers: number; 
    totalWorkouts: number; 
    activeToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    avgWorkoutsPerUser: number;
  }>;
  setUserRole(userId: string, role: string): Promise<User | undefined>;
  updateUserAvatar(userId: string, avatarUrl: string): Promise<User | undefined>;
  
  // Custom exercises (public database)
  getCustomExercises(): Promise<SelectCustomExercise[]>;
  getCustomExercise(id: string): Promise<SelectCustomExercise | undefined>;
  createCustomExercise(exercise: Omit<InsertCustomExercise, 'id'>): Promise<SelectCustomExercise>;
  updateCustomExercise(id: string, exercise: Partial<InsertCustomExercise>): Promise<SelectCustomExercise | undefined>;
  deleteCustomExercise(id: string): Promise<boolean>;
  
  // User exercises (private + pending)
  getUserExercises(userId: string): Promise<SelectUserExercise[]>;
  createUserExercise(userId: string, exercise: Omit<InsertUserExercise, 'id' | 'userId'>): Promise<SelectUserExercise>;
  updateUserExercise(userId: string, id: string, exercise: Partial<InsertUserExercise>): Promise<SelectUserExercise | undefined>;
  deleteUserExercise(userId: string, id: string): Promise<boolean>;
  submitUserExercise(userId: string, id: string): Promise<SelectUserExercise | undefined>;
  
  // Moderation
  getPendingSubmissions(): Promise<SelectUserExercise[]>;
  approveSubmission(id: string, adminId: string, notes?: string): Promise<SelectCustomExercise | undefined>;
  rejectSubmission(id: string, adminId: string, notes?: string): Promise<boolean>;
  
  // Workout Templates
  getWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]>;
  createWorkoutTemplate(userId: string, template: Omit<WorkoutTemplate, 'id'>): Promise<WorkoutTemplate>;
  updateWorkoutTemplate(userId: string, id: string, template: Partial<WorkoutTemplate>): Promise<WorkoutTemplate | undefined>;
  deleteWorkoutTemplate(userId: string, id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const id = randomUUID();
    const [user] = await db
      .insert(users)
      .values({ id, ...userData })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // User Profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    
    if (!profile) return undefined;
    
    return {
      id: profile.id,
      gender: profile.gender as 'male' | 'female',
      age: profile.age,
      height: profile.height,
      weight: profile.weight,
      fat: profile.fat ?? undefined,
      experienceYears: profile.experienceYears,
      sleep: profile.sleep ?? 7,
      stress: (profile.stress as 'low' | 'moderate' | 'high') ?? 'moderate',
      calories: (profile.calories as 'surplus' | 'maintenance' | 'deficit') ?? 'maintenance',
      goal: (profile.goal as 'hypertrophy' | 'strength' | 'endurance') ?? 'hypertrophy',
      trainingDays: profile.trainingDays ?? 3,
      priorityMuscles: profile.priorityMuscles ?? [],
      cycle: profile.cycleLastPeriod ? {
        lastPeriod: profile.cycleLastPeriod,
        length: profile.cycleLength ?? 28
      } : undefined
    };
  }

  async saveUserProfile(userId: string, profile: UserProfile): Promise<UserProfile> {
    const id = profile.id || randomUUID();
    
    const [existing] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    
    if (existing) {
      await db
        .update(userProfiles)
        .set({
          gender: profile.gender,
          age: profile.age,
          height: profile.height,
          weight: profile.weight,
          fat: profile.fat ?? null,
          experienceYears: profile.experienceYears,
          sleep: profile.sleep,
          stress: profile.stress,
          calories: profile.calories,
          goal: profile.goal,
          trainingDays: profile.trainingDays,
          priorityMuscles: profile.priorityMuscles,
          cycleLastPeriod: profile.cycle?.lastPeriod ?? null,
          cycleLength: profile.cycle?.length ?? null,
          updatedAt: new Date()
        })
        .where(eq(userProfiles.userId, userId));
      
      return { ...profile, id: existing.id };
    }
    
    const [newProfile] = await db
      .insert(userProfiles)
      .values({
        id,
        userId,
        gender: profile.gender,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        fat: profile.fat ?? null,
        experienceYears: profile.experienceYears,
        sleep: profile.sleep,
        stress: profile.stress,
        calories: profile.calories,
        goal: profile.goal,
        trainingDays: profile.trainingDays,
        priorityMuscles: profile.priorityMuscles,
        cycleLastPeriod: profile.cycle?.lastPeriod ?? null,
        cycleLength: profile.cycle?.length ?? null
      })
      .returning();
    
    return { ...profile, id: newProfile.id };
  }

  // Workout operations
  async getWorkouts(userId: string): Promise<Workout[]> {
    const rows = await db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, userId))
      .orderBy(desc(workouts.date));
    
    return rows.map(row => ({
      id: row.id,
      date: row.date.getTime(),
      exercises: row.exercises
    }));
  }

  async getWorkout(userId: string, id: string): Promise<Workout | undefined> {
    const [row] = await db
      .select()
      .from(workouts)
      .where(and(eq(workouts.userId, userId), eq(workouts.id, id)));
    
    if (!row) return undefined;
    
    return {
      id: row.id,
      date: row.date.getTime(),
      exercises: row.exercises
    };
  }

  async addWorkout(userId: string, workout: Omit<Workout, 'id'>): Promise<Workout> {
    const id = randomUUID();
    
    const [row] = await db
      .insert(workouts)
      .values({
        id,
        userId,
        date: new Date(workout.date),
        exercises: workout.exercises
      })
      .returning();
    
    return {
      id: row.id,
      date: row.date.getTime(),
      exercises: row.exercises
    };
  }

  async updateWorkout(userId: string, id: string, updates: Partial<Workout>): Promise<Workout | undefined> {
    const existing = await this.getWorkout(userId, id);
    if (!existing) return undefined;
    
    const updateData: any = {};
    if (updates.date !== undefined) updateData.date = new Date(updates.date);
    if (updates.exercises !== undefined) updateData.exercises = updates.exercises;
    
    await db
      .update(workouts)
      .set(updateData)
      .where(and(eq(workouts.userId, userId), eq(workouts.id, id)));
    
    return this.getWorkout(userId, id);
  }

  async deleteWorkout(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(workouts)
      .where(and(eq(workouts.userId, userId), eq(workouts.id, id)));
    
    return true;
  }

  // Body Log operations
  async getBodyLogs(userId: string): Promise<BodyLog[]> {
    const rows = await db
      .select()
      .from(bodyLogs)
      .where(eq(bodyLogs.userId, userId))
      .orderBy(desc(bodyLogs.date));
    
    return rows.map(row => ({
      id: row.id,
      date: row.date.getTime(),
      weight: row.weight,
      fat: row.fat ?? undefined
    }));
  }

  async addBodyLog(userId: string, log: Omit<BodyLog, 'id'>): Promise<BodyLog> {
    const id = randomUUID();
    
    const [row] = await db
      .insert(bodyLogs)
      .values({
        id,
        userId,
        date: new Date(log.date),
        weight: log.weight,
        fat: log.fat ?? null
      })
      .returning();
    
    return {
      id: row.id,
      date: row.date.getTime(),
      weight: row.weight,
      fat: row.fat ?? undefined
    };
  }

  async deleteBodyLog(userId: string, id: string): Promise<boolean> {
    await db
      .delete(bodyLogs)
      .where(and(eq(bodyLogs.userId, userId), eq(bodyLogs.id, id)));
    
    return true;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserStats(): Promise<{ 
    totalUsers: number; 
    totalWorkouts: number; 
    activeToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    avgWorkoutsPerUser: number;
  }> {
    const [usersResult] = await db.select({ count: count() }).from(users);
    const [workoutsResult] = await db.select({ count: count() }).from(workouts);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [activeResult] = await db
      .select({ count: count() })
      .from(workouts)
      .where(sql`${workouts.date} >= ${today}`);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const [newUsersWeekResult] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= ${weekAgo}`);
    
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const [newUsersMonthResult] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= ${monthAgo}`);
    
    const totalUsers = usersResult?.count || 0;
    const totalWorkouts = workoutsResult?.count || 0;
    const avgWorkoutsPerUser = totalUsers > 0 ? totalWorkouts / totalUsers : 0;
    
    return {
      totalUsers,
      totalWorkouts,
      activeToday: activeResult?.count || 0,
      newUsersThisWeek: newUsersWeekResult?.count || 0,
      newUsersThisMonth: newUsersMonthResult?.count || 0,
      avgWorkoutsPerUser
    };
  }

  async setUserRole(userId: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserAvatar(userId: string, avatarUrl: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ profileImageUrl: avatarUrl, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Custom exercises (public database)
  async getCustomExercises(): Promise<SelectCustomExercise[]> {
    return await db.select().from(customExercises).orderBy(customExercises.name);
  }

  async getCustomExercise(id: string): Promise<SelectCustomExercise | undefined> {
    const [exercise] = await db.select().from(customExercises).where(eq(customExercises.id, id));
    return exercise;
  }

  async createCustomExercise(exercise: Omit<InsertCustomExercise, 'id'>): Promise<SelectCustomExercise> {
    const id = randomUUID();
    const [result] = await db
      .insert(customExercises)
      .values({ id, ...exercise })
      .returning();
    return result;
  }

  async updateCustomExercise(id: string, exercise: Partial<InsertCustomExercise>): Promise<SelectCustomExercise | undefined> {
    const [result] = await db
      .update(customExercises)
      .set({ ...exercise, updatedAt: new Date() })
      .where(eq(customExercises.id, id))
      .returning();
    return result;
  }

  async deleteCustomExercise(id: string): Promise<boolean> {
    await db.delete(customExercises).where(eq(customExercises.id, id));
    return true;
  }

  // User exercises (private + pending)
  async getUserExercises(userId: string): Promise<SelectUserExercise[]> {
    return await db
      .select()
      .from(userExercises)
      .where(eq(userExercises.userId, userId))
      .orderBy(desc(userExercises.createdAt));
  }

  async createUserExercise(userId: string, exercise: Omit<InsertUserExercise, 'id' | 'userId'>): Promise<SelectUserExercise> {
    const id = randomUUID();
    const [result] = await db
      .insert(userExercises)
      .values({ id, userId, ...exercise })
      .returning();
    return result;
  }

  async updateUserExercise(userId: string, id: string, exercise: Partial<InsertUserExercise>): Promise<SelectUserExercise | undefined> {
    const [result] = await db
      .update(userExercises)
      .set({ ...exercise, updatedAt: new Date() })
      .where(and(eq(userExercises.userId, userId), eq(userExercises.id, id)))
      .returning();
    return result;
  }

  async deleteUserExercise(userId: string, id: string): Promise<boolean> {
    await db
      .delete(userExercises)
      .where(and(eq(userExercises.userId, userId), eq(userExercises.id, id)));
    return true;
  }

  async submitUserExercise(userId: string, id: string): Promise<SelectUserExercise | undefined> {
    const [result] = await db
      .update(userExercises)
      .set({ 
        visibility: 'pending',
        submittedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(userExercises.userId, userId), eq(userExercises.id, id)))
      .returning();
    return result;
  }

  // Moderation
  async getPendingSubmissions(): Promise<SelectUserExercise[]> {
    return await db
      .select()
      .from(userExercises)
      .where(eq(userExercises.visibility, 'pending'))
      .orderBy(userExercises.submittedAt);
  }

  async approveSubmission(id: string, adminId: string, notes?: string): Promise<SelectCustomExercise | undefined> {
    const [submission] = await db
      .select()
      .from(userExercises)
      .where(eq(userExercises.id, id));
    
    if (!submission) return undefined;
    
    const newExercise = await this.createCustomExercise({
      name: submission.name,
      muscle: submission.muscle,
      type: submission.type,
      technique: submission.technique,
      imageUrl: submission.imageUrl,
      videoUrl: submission.videoUrl,
      createdBy: submission.userId
    });
    
    await db
      .update(userExercises)
      .set({
        visibility: 'public',
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
        approvedExerciseId: newExercise.id,
        updatedAt: new Date()
      })
      .where(eq(userExercises.id, id));
    
    return newExercise;
  }

  async rejectSubmission(id: string, adminId: string, notes?: string): Promise<boolean> {
    await db
      .update(userExercises)
      .set({
        visibility: 'private',
        status: 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
        updatedAt: new Date()
      })
      .where(eq(userExercises.id, id));
    
    return true;
  }

  // Workout Templates
  async getWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
    const results = await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.userId, userId))
      .orderBy(desc(workoutTemplates.createdAt));
    
    return results.map(t => ({
      id: t.id,
      name: t.name,
      exercises: t.exercises as WorkoutTemplate['exercises']
    }));
  }

  async createWorkoutTemplate(userId: string, template: Omit<WorkoutTemplate, 'id'>): Promise<WorkoutTemplate> {
    const id = randomUUID();
    const [result] = await db
      .insert(workoutTemplates)
      .values({
        id,
        userId,
        name: template.name,
        exercises: template.exercises,
      })
      .returning();
    
    return {
      id: result.id,
      name: result.name,
      exercises: result.exercises as WorkoutTemplate['exercises']
    };
  }

  async updateWorkoutTemplate(userId: string, id: string, template: Partial<WorkoutTemplate>): Promise<WorkoutTemplate | undefined> {
    const updateData: Partial<InsertWorkoutTemplate> = {};
    if (template.name !== undefined) updateData.name = template.name;
    if (template.exercises !== undefined) updateData.exercises = template.exercises;
    
    const [result] = await db
      .update(workoutTemplates)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(workoutTemplates.userId, userId), eq(workoutTemplates.id, id)))
      .returning();
    
    if (!result) return undefined;
    
    return {
      id: result.id,
      name: result.name,
      exercises: result.exercises as WorkoutTemplate['exercises']
    };
  }

  async deleteWorkoutTemplate(userId: string, id: string): Promise<boolean> {
    await db
      .delete(workoutTemplates)
      .where(and(eq(workoutTemplates.userId, userId), eq(workoutTemplates.id, id)));
    return true;
  }
}

export const storage = new DatabaseStorage();
