import { 
  type UserProfile, 
  type Workout, 
  type BodyLog,
  type User,
  type UpsertUser,
  users,
  userProfiles,
  workouts,
  bodyLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
}

export const storage = new DatabaseStorage();
