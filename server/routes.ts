import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { barcodeLoginSchema } from "@shared/schema";
import { FirestoreUserService } from "./firebase";

export async function registerRoutes(app: Express): Promise<Server> {

  // Barcode login endpoint (Using Firestore)
  app.post("/api/auth/barcode-login", async (req, res) => {
    try {
      const { barcodeNumber } = barcodeLoginSchema.parse(req.body);
      
      console.log(`🔍 Login attempt with barcode: ${barcodeNumber}`);

      // Find user in Firestore
      const user = await FirestoreUserService.findBySerial(barcodeNumber);

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
      res.status(500).json({
        error: "Server error",
        message: error instanceof Error ? error.message : "حدث خطأ في تسجيل الدخول",
      });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await FirestoreUserService.findById(id);

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
      
      const user = await FirestoreUserService.updateProgress(id, updates);
      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "المستخدم غير موجود",
        });
      }

      res.json({ user });
    } catch (error) {
      console.error("Update progress error:", error);
      res.status(500).json({
        error: "Update failed",
        message: "فشل تحديث التقدم",
      });
    }
  });

  // Temporary endpoint to fix demo user IDs (remove after use)
  app.post("/api/admin/fix-demo-ids", async (req, res) => {
    try {
      await FirestoreUserService.fixDemoUserIds();
      res.json({ success: true, message: "Demo user IDs fixed successfully" });
    } catch (error) {
      console.error("Fix demo IDs error:", error);
      res.status(500).json({
        error: "Fix failed",
        message: error instanceof Error ? error.message : "فشل إصلاح معرفات المستخدمين",
      });
    }
  });

  // Temporary endpoint to cleanup duplicate users (remove after use)
  app.post("/api/admin/cleanup-duplicates", async (req, res) => {
    try {
      await FirestoreUserService.cleanupDuplicateUsers();
      res.json({ success: true, message: "Duplicate users cleaned up successfully" });
    } catch (error) {
      console.error("Cleanup error:", error);
      res.status(500).json({
        error: "Cleanup failed",
        message: error instanceof Error ? error.message : "فشل تنظيف البيانات المكررة",
      });
    }
  });

  // Temporary endpoint to update users with realistic data (remove after use)
  app.post("/api/admin/update-realistic-data", async (req, res) => {
    try {
      await FirestoreUserService.updateAllUsersWithRealisticData();
      res.json({ success: true, message: "Users updated with realistic data successfully" });
    } catch (error) {
      console.error("Update realistic data error:", error);
      res.status(500).json({
        error: "Update failed",
        message: error instanceof Error ? error.message : "فشل تحديث البيانات الواقعية",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
