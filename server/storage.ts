import { 
  type UserProfile, 
  type Workout, 
  type BodyLog 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(): Promise<UserProfile | undefined>;
  saveUser(user: UserProfile): Promise<UserProfile>;
  
  getWorkouts(): Promise<Workout[]>;
  getWorkout(id: string): Promise<Workout | undefined>;
  addWorkout(workout: Omit<Workout, 'id'>): Promise<Workout>;
  updateWorkout(id: string, workout: Partial<Workout>): Promise<Workout | undefined>;
  deleteWorkout(id: string): Promise<boolean>;
  
  getBodyLogs(): Promise<BodyLog[]>;
  addBodyLog(log: Omit<BodyLog, 'id'>): Promise<BodyLog>;
  deleteBodyLog(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private user: UserProfile | undefined;
  private workouts: Map<string, Workout>;
  private bodyLogs: Map<string, BodyLog>;

  constructor() {
    this.user = undefined;
    this.workouts = new Map();
    this.bodyLogs = new Map();
  }

  async getUser(): Promise<UserProfile | undefined> {
    return this.user;
  }

  async saveUser(user: UserProfile): Promise<UserProfile> {
    const id = user.id || randomUUID();
    this.user = { ...user, id };
    return this.user;
  }

  async getWorkouts(): Promise<Workout[]> {
    return Array.from(this.workouts.values());
  }

  async getWorkout(id: string): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async addWorkout(workout: Omit<Workout, 'id'>): Promise<Workout> {
    const id = randomUUID();
    const newWorkout: Workout = { ...workout, id };
    this.workouts.set(id, newWorkout);
    return newWorkout;
  }

  async updateWorkout(id: string, updates: Partial<Workout>): Promise<Workout | undefined> {
    const existing = this.workouts.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.workouts.set(id, updated);
    return updated;
  }

  async deleteWorkout(id: string): Promise<boolean> {
    return this.workouts.delete(id);
  }

  async getBodyLogs(): Promise<BodyLog[]> {
    return Array.from(this.bodyLogs.values());
  }

  async addBodyLog(log: Omit<BodyLog, 'id'>): Promise<BodyLog> {
    const id = randomUUID();
    const newLog: BodyLog = { ...log, id };
    this.bodyLogs.set(id, newLog);
    return newLog;
  }

  async deleteBodyLog(id: string): Promise<boolean> {
    return this.bodyLogs.delete(id);
  }
}

export const storage = new MemStorage();
