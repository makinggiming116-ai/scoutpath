import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { barcodeLoginSchema } from "@shared/schema";

// Demo users data (works without Firebase)
const demoUsers = [
  {
    id: "demo-user-1",
    name: "سعيد محمد خليفة",
    serial: "112",
    currentStage: 6,
    progress: {
      openedCourses: [1, 2, 3, 4, 5],
      completedExams: [1, 2, 3],
      scores: [85, 90, 78],
    },
  },
  {
    id: "demo-user-2",
    name: "أحمد محمود السيد",
    serial: "101",
    currentStage: 3,
    progress: {
      openedCourses: [1, 2],
      completedExams: [1],
      scores: [92],
    },
  },
  {
    id: "demo-user-3",
    name: "محمد أحمد علي",
    serial: "105",
    currentStage: 1,
    progress: {
      openedCourses: [],
      completedExams: [],
      scores: [],
    },
  },
];

export async function registerRoutes(app: Express): Promise<Server> {
  // Barcode login endpoint (Demo mode)
  app.post("/api/auth/barcode-login", async (req, res) => {
    try {
      const { barcodeNumber } = barcodeLoginSchema.parse(req.body);
      
      console.log(`🔍 Login attempt with barcode: ${barcodeNumber}`);

      // Find user in demo data
      const user = demoUsers.find(u => u.serial === barcodeNumber);

      if (!user) {
        console.log(`❌ User not found for barcode: ${barcodeNumber}`);
        return res.status(404).json({
          error: "User not found",
          message: "الرقم غير موجود في النظام. جرب: 112، 101، أو 105",
        });
      }

      console.log(`✅ User found: ${user.name}`);
      res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({
        error: "Invalid request",
        message: error instanceof Error ? error.message : "حدث خطأ في تسجيل الدخول",
      });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = demoUsers.find(u => u.id === id);

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "المستخدم غير موجود",
        });
      }

      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        error: "Server error",
        message: "حدث خطأ في جلب بيانات المستخدم",
      });
    }
  });

  // Update user progress
  app.patch("/api/users/:id/progress", async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = z.object({
        openedCourses: z.array(z.number()).optional(),
        completedExams: z.array(z.number()).optional(),
        scores: z.array(z.number()).optional(),
      });

      const updates = updateSchema.parse(req.body);
      
      const user = demoUsers.find(u => u.id === id);
      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "المستخدم غير موجود",
        });
      }

      // Update progress
      if (updates.openedCourses) user.progress.openedCourses = updates.openedCourses;
      if (updates.completedExams) user.progress.completedExams = updates.completedExams;
      if (updates.scores) user.progress.scores = updates.scores;

      res.json({ user });
    } catch (error) {
      console.error("Update progress error:", error);
      res.status(400).json({
        error: "Update failed",
        message: "فشل تحديث التقدم",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
