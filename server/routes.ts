import type { Express } from "express";
import { createServer, type Server } from "http";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { z } from "zod";
import { barcodeLoginSchema } from "@shared/schema";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  // For now, we'll use a simple configuration
  // In production, you would use the service account
  try {
    initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "bibleverseapp-d43ac",
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

const db = getFirestore();

export async function registerRoutes(app: Express): Promise<Server> {
  // Barcode login endpoint
  app.post("/api/auth/barcode-login", async (req, res) => {
    try {
      const { barcodeNumber } = barcodeLoginSchema.parse(req.body);

      // Query Firestore for user with this barcode number
      const usersRef = db.collection("users");
      const query = usersRef.where("serialNumber", "==", barcodeNumber).limit(1);
      const snapshot = await query.get();

      if (snapshot.empty) {
        return res.status(404).json({
          error: "User not found",
          message: "الرقم غير موجود في النظام",
        });
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      const user = {
        id: userDoc.id,
        name: userData.name || "",
        serialNumber: userData.serialNumber || barcodeNumber,
        stage: userData.stage || 1,
        completedCourses: userData.completedCourses || [],
        certificates: userData.certificates || [],
      };

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
      const userDoc = await db.collection("users").doc(id).get();

      if (!userDoc.exists) {
        return res.status(404).json({
          error: "User not found",
          message: "المستخدم غير موجود",
        });
      }

      const userData = userDoc.data();
      const user = {
        id: userDoc.id,
        name: userData?.name || "",
        serialNumber: userData?.serialNumber || "",
        stage: userData?.stage || 1,
        completedCourses: userData?.completedCourses || [],
        certificates: userData?.certificates || [],
      };

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
        completedCourses: z.array(z.number()).optional(),
        certificates: z.array(z.number()).optional(),
      });

      const updates = updateSchema.parse(req.body);
      
      await db.collection("users").doc(id).update(updates);

      const updatedDoc = await db.collection("users").doc(id).get();
      const userData = updatedDoc.data();

      const user = {
        id: updatedDoc.id,
        name: userData?.name || "",
        serialNumber: userData?.serialNumber || "",
        stage: userData?.stage || 1,
        completedCourses: userData?.completedCourses || [],
        certificates: userData?.certificates || [],
      };

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
