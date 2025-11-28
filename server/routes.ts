import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import OpenAI from "openai";
import { COACH_PERSONAS, type CoachPersonaId } from "@shared/schema";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const objectStorage = new ObjectStorageService();

const isAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    const user = await storage.getUser(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Ошибка проверки прав" });
  }
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Replit Auth
  await setupAuth(app);
  
  // Auth user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile endpoints (training profile, not auth user)
  app.get("/api/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });

  app.post("/api/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.saveUserProfile(userId, req.body);
      res.json(profile);
    } catch (error) {
      console.error("Error saving user profile:", error);
      res.status(500).json({ error: "Failed to save user profile" });
    }
  });

  // Workout endpoints
  app.get("/api/workouts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workouts = await storage.getWorkouts(userId);
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get workouts" });
    }
  });

  app.get("/api/workouts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workout = await storage.getWorkout(userId, req.params.id);
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      res.status(500).json({ error: "Failed to get workout" });
    }
  });

  app.post("/api/workouts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workout = await storage.addWorkout(userId, req.body);
      res.json(workout);
    } catch (error) {
      console.error("Error adding workout:", error);
      res.status(500).json({ error: "Failed to add workout" });
    }
  });

  app.patch("/api/workouts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workout = await storage.updateWorkout(userId, req.params.id, req.body);
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      res.status(500).json({ error: "Failed to update workout" });
    }
  });

  app.delete("/api/workouts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteWorkout(userId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Workout not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workout" });
    }
  });

  // Body log endpoints
  app.get("/api/body-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logs = await storage.getBodyLogs(userId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get body logs" });
    }
  });

  app.post("/api/body-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const log = await storage.addBodyLog(userId, req.body);
      res.json(log);
    } catch (error) {
      console.error("Error adding body log:", error);
      res.status(500).json({ error: "Failed to add body log" });
    }
  });

  app.delete("/api/body-logs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteBodyLog(userId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Body log not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete body log" });
    }
  });

  // AI Chat endpoint (protected)
  app.post("/api/chat", isAuthenticated, async (req: any, res) => {
    try {
      const { coachId, message, image, history, userContext } = req.body;
      
      const coach = COACH_PERSONAS[coachId as CoachPersonaId];
      if (!coach) {
        return res.status(400).json({ error: "Invalid coach ID" });
      }

      const contextInfo = userContext ? `
Контекст пользователя:
- Цель: ${userContext.goal || 'не указана'}
- Опыт тренировок: ${userContext.experienceYears || 0} лет
- Сон: ${userContext.sleep || 7} часов
- Стресс: ${userContext.stress || 'moderate'}
- Недавних тренировок: ${userContext.recentWorkouts?.length || 0}
` : '';

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system" as const,
          content: `${coach.systemPrompt}\n\n${contextInfo}`
        }
      ];

      if (history && Array.isArray(history)) {
        for (const msg of history.slice(-8)) {
          if (msg.role === 'user') {
            if (msg.image) {
              messages.push({
                role: "user" as const,
                content: [
                  { type: "text" as const, text: msg.text || "Что на этом изображении?" },
                  { 
                    type: "image_url" as const, 
                    image_url: { url: `data:image/jpeg;base64,${msg.image}` } 
                  }
                ]
              });
            } else {
              messages.push({ role: "user" as const, content: msg.text });
            }
          } else if (msg.role === 'assistant') {
            messages.push({ role: "assistant" as const, content: msg.text });
          }
        }
      }

      if (image) {
        messages.push({
          role: "user" as const,
          content: [
            { type: "text" as const, text: message || "Что на этом изображении?" },
            { 
              type: "image_url" as const, 
              image_url: { url: `data:image/jpeg;base64,${image}` } 
            }
          ]
        });
      } else if (message) {
        messages.push({ role: "user" as const, content: message });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 1024,
        temperature: 0.7
      });

      const aiResponse = response.choices[0]?.message?.content || 
        "Извините, не удалось получить ответ.";

      res.json({ response: aiResponse });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ 
        error: "Failed to process chat",
        response: "Извините, произошла ошибка. Попробуйте еще раз." 
      });
    }
  });

  // --- Object Storage Routes ---
  app.get("/api/objects/upload-url", isAuthenticated, async (req: any, res) => {
    try {
      const url = await objectStorage.getObjectEntityUploadURL();
      res.json({ uploadUrl: url });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Не удалось получить URL для загрузки" });
    }
  });

  app.get("/objects/*", async (req: any, res) => {
    try {
      const objectPath = req.path;
      const objectFile = await objectStorage.getObjectEntityFile(objectPath);
      const userId = req.user?.claims?.sub;
      
      const canAccess = await objectStorage.canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission: ObjectPermission.READ
      });
      
      if (!canAccess) {
        return res.status(403).json({ error: "Доступ запрещен" });
      }
      
      await objectStorage.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Объект не найден" });
      }
      console.error("Error downloading object:", error);
      res.status(500).json({ error: "Ошибка загрузки объекта" });
    }
  });

  // --- Admin Routes ---
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения статистики" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения пользователей" });
    }
  });

  app.patch("/api/admin/users/:id/role", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { role } = req.body;
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Недопустимая роль" });
      }
      const user = await storage.setUserRole(req.params.id, role);
      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Ошибка изменения роли" });
    }
  });

  // --- Custom Exercises Routes (public database, admin-managed) ---
  app.get("/api/exercises", async (req: any, res) => {
    try {
      const exercises = await storage.getCustomExercises();
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения упражнений" });
    }
  });

  app.get("/api/exercises/:id", async (req: any, res) => {
    try {
      const exercise = await storage.getCustomExercise(req.params.id);
      if (!exercise) {
        return res.status(404).json({ error: "Упражнение не найдено" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения упражнения" });
    }
  });

  app.post("/api/admin/exercises", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exercise = await storage.createCustomExercise({
        ...req.body,
        createdBy: userId
      });
      res.json(exercise);
    } catch (error) {
      console.error("Error creating exercise:", error);
      res.status(500).json({ error: "Ошибка создания упражнения" });
    }
  });

  app.put("/api/admin/exercises/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const exercise = await storage.updateCustomExercise(req.params.id, req.body);
      if (!exercise) {
        return res.status(404).json({ error: "Упражнение не найдено" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(500).json({ error: "Ошибка обновления упражнения" });
    }
  });

  app.delete("/api/admin/exercises/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.deleteCustomExercise(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Ошибка удаления упражнения" });
    }
  });

  // --- User Exercises Routes (private exercises) ---
  app.get("/api/user-exercises", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exercises = await storage.getUserExercises(userId);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения упражнений" });
    }
  });

  app.post("/api/user-exercises", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exercise = await storage.createUserExercise(userId, req.body);
      res.json(exercise);
    } catch (error) {
      console.error("Error creating user exercise:", error);
      res.status(500).json({ error: "Ошибка создания упражнения" });
    }
  });

  app.put("/api/user-exercises/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exercise = await storage.updateUserExercise(userId, req.params.id, req.body);
      if (!exercise) {
        return res.status(404).json({ error: "Упражнение не найдено" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(500).json({ error: "Ошибка обновления упражнения" });
    }
  });

  app.delete("/api/user-exercises/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteUserExercise(userId, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Ошибка удаления упражнения" });
    }
  });

  app.post("/api/user-exercises/:id/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exercise = await storage.submitUserExercise(userId, req.params.id);
      if (!exercise) {
        return res.status(404).json({ error: "Упражнение не найдено" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(500).json({ error: "Ошибка отправки на модерацию" });
    }
  });

  // --- Moderation Routes ---
  app.get("/api/admin/submissions", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const submissions = await storage.getPendingSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения заявок" });
    }
  });

  app.post("/api/admin/submissions/:id/approve", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { notes } = req.body;
      const exercise = await storage.approveSubmission(req.params.id, adminId, notes);
      if (!exercise) {
        return res.status(404).json({ error: "Заявка не найдена" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(500).json({ error: "Ошибка одобрения заявки" });
    }
  });

  app.post("/api/admin/submissions/:id/reject", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { notes } = req.body;
      await storage.rejectSubmission(req.params.id, adminId, notes);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Ошибка отклонения заявки" });
    }
  });

  return httpServer;
}
