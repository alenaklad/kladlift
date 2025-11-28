import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { COACH_PERSONAS, type CoachPersonaId } from "@shared/schema";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser();
      res.json(user || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.post("/api/user", async (req, res) => {
    try {
      const user = await storage.saveUser(req.body);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to save user" });
    }
  });

  app.get("/api/workouts", async (req, res) => {
    try {
      const workouts = await storage.getWorkouts();
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get workouts" });
    }
  });

  app.get("/api/workouts/:id", async (req, res) => {
    try {
      const workout = await storage.getWorkout(req.params.id);
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      res.status(500).json({ error: "Failed to get workout" });
    }
  });

  app.post("/api/workouts", async (req, res) => {
    try {
      const workout = await storage.addWorkout(req.body);
      res.json(workout);
    } catch (error) {
      res.status(500).json({ error: "Failed to add workout" });
    }
  });

  app.patch("/api/workouts/:id", async (req, res) => {
    try {
      const workout = await storage.updateWorkout(req.params.id, req.body);
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      res.status(500).json({ error: "Failed to update workout" });
    }
  });

  app.delete("/api/workouts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkout(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Workout not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workout" });
    }
  });

  app.get("/api/body-logs", async (req, res) => {
    try {
      const logs = await storage.getBodyLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get body logs" });
    }
  });

  app.post("/api/body-logs", async (req, res) => {
    try {
      const log = await storage.addBodyLog(req.body);
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to add body log" });
    }
  });

  app.delete("/api/body-logs/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBodyLog(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Body log not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete body log" });
    }
  });

  app.post("/api/chat", async (req, res) => {
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

  return httpServer;
}
