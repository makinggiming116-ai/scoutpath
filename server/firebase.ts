import { getFirestore } from 'firebase-admin/firestore';
import type { User } from '@shared/schema';
import { initializeFirebaseAdmin } from './firebaseConfig';

// Initialize Firebase Admin SDK
const app = initializeFirebaseAdmin();
export const db = getFirestore(app);

// Firestore service functions
export class FirestoreUserService {
  private static collection = db.collection('users');

  // Find user by serial number (barcode)
  static async findBySerial(serial: string): Promise<User | null> {
    try {
      console.log(`🔍 Searching for user with serial: ${serial}`);
      
      const querySnapshot = await this.collection.where('serial', '==', serial).get();
      
      if (querySnapshot.empty) {
        console.log(`❌ No user found with serial: ${serial}`);
        return null;
      }

      // Log all found users to check for duplicates
      console.log(`📋 Found ${querySnapshot.docs.length} user(s) with serial ${serial}:`);
      querySnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ID: ${doc.id}, Name: ${data.name}, Stage: ${data.currentStage}`);
      });

      const doc = querySnapshot.docs[0];
      const userData = doc.data();
      
      const user = {
        id: doc.id,
        name: userData.name,
        serial: userData.serial,
        currentStage: userData.currentStage,
        progress: userData.progress || {
          openedCourses: [],
          completedExams: [],
          scores: [],
        },
      };

      console.log(`✅ Returning user: ${user.name} (Stage: ${user.currentStage})`);
      return user;
    } catch (error) {
      console.error('Error finding user by serial:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    try {
      const doc = await this.collection.doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const userData = doc.data()!;
      
      return {
        id: doc.id,
        name: userData.name,
        serial: userData.serial,
        currentStage: userData.currentStage,
        progress: userData.progress || {
          openedCourses: [],
          completedExams: [],
          scores: [],
        },
      };
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Update user progress
  static async updateProgress(
    id: string, 
    updates: {
      openedCourses?: number[];
      completedExams?: number[];
      scores?: number[];
    }
  ): Promise<User | null> {
    try {
      const userRef = this.collection.doc(id);
      const doc = await userRef.get();
      
      if (!doc.exists) {
        return null;
      }

      const updateData: any = {};
      if (updates.openedCourses) updateData['progress.openedCourses'] = updates.openedCourses;
      if (updates.completedExams) {
        const normalizedCompletedExams = Array.from(
          new Set(updates.completedExams.filter((n) => typeof n === 'number'))
        ).sort((a, b) => a - b);
        updateData['progress.completedExams'] = normalizedCompletedExams;

        const completedCount = normalizedCompletedExams.length;
        const currentStage =
          completedCount >= 8
            ? 8
            : completedCount === 7
            ? 7.5
            : completedCount + 1;
        updateData['currentStage'] = currentStage;
      }
      if (updates.scores) updateData['progress.scores'] = updates.scores;

      await userRef.update(updateData);
      
      // Return updated user
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  }

  // Utility function to clean up duplicate users (use with caution)
  static async cleanupDuplicateUsers(): Promise<void> {
    try {
      console.log('🧹 Starting cleanup of duplicate users...');
      
      const querySnapshot = await this.collection.get();
      const usersBySerial = new Map<string, any[]>();
      
      // Group users by serial number
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const serial = data.serial;
        
        if (!usersBySerial.has(serial)) {
          usersBySerial.set(serial, []);
        }
        
        usersBySerial.get(serial)!.push({
          id: doc.id,
          data: data,
          ref: doc.ref
        });
      });
      
      // Find and log duplicates
      for (const [serial, users] of Array.from(usersBySerial.entries())) {
        if (users.length > 1) {
          console.log(`🔍 Found ${users.length} users with serial ${serial}:`);
          users.forEach((user: any, index: number) => {
            console.log(`  ${index + 1}. ID: ${user.id}, Name: ${user.data.name}, Stage: ${user.data.currentStage}`);
          });
          
          // Keep the first user, delete the rest
          for (let i = 1; i < users.length; i++) {
            console.log(`🗑️ Deleting duplicate user: ${users[i].data.name} (${users[i].id})`);
            await users[i].ref.delete();
          }
        }
      }
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('Error cleaning up duplicate users:', error);
      throw error;
    }
  }

  // Fix demo user IDs by recreating them with proper Firestore IDs
  static async fixDemoUserIds(): Promise<void> {
    try {
      console.log('🔧 Starting to fix demo user IDs...');
      
      // Get all users with demo IDs
      const querySnapshot = await this.collection.get();
      const usersToFix: any[] = [];
      
      querySnapshot.docs.forEach(doc => {
        if (doc.id.startsWith('demo-user')) {
          const data = doc.data();
          usersToFix.push({
            oldId: doc.id,
            data: data,
            ref: doc.ref
          });
          console.log(`🔍 Found demo user: ${doc.id} - ${data.name} (${data.serial})`);
        }
      });
      
      if (usersToFix.length === 0) {
        console.log('✅ No demo users found to fix');
        return;
      }
      
      // Recreate users with proper IDs
      for (const user of usersToFix) {
        console.log(`🔄 Recreating user: ${user.data.name} (${user.data.serial})`);
        
        // Add new document (Firestore will generate proper ID)
        const newDoc = await this.collection.add({
          name: user.data.name,
          serial: user.data.serial,
          currentStage: user.data.currentStage,
          progress: user.data.progress || {
            openedCourses: [],
            completedExams: [],
            scores: [],
          }
        });
        
        console.log(`✅ Created new user with ID: ${newDoc.id}`);
        
        // Delete old demo user
        await user.ref.delete();
        console.log(`🗑️ Deleted old demo user: ${user.oldId}`);
      }
      
      console.log('🎉 All demo user IDs fixed successfully!');
    } catch (error) {
      console.error('Error fixing demo user IDs:', error);
      throw error;
    }
  }

  // Update user progress and achievements
  static async updateUserAchievements(userId: string, completedCourses: number[]): Promise<User | null> {
    try {
      console.log(`🎯 Updating achievements for user: ${userId}`);
      
      const userRef = this.collection.doc(userId);
      const doc = await userRef.get();
      
      if (!doc.exists) {
        return null;
      }

      // Calculate achievements based on completed courses
      const completedExams = completedCourses;
      const scores = completedCourses.map(() => Math.floor(Math.random() * 30) + 70); // Random scores between 70-100
      const certificates = completedCourses.length; // Same as completed courses
      
      // Update current stage based on completed courses
      const completedCount = completedCourses.length;
      const currentStage =
        completedCount >= 8
          ? 8
          : completedCount === 7
          ? 7.5
          : completedCount + 1;
      
      const updateData = {
        currentStage: currentStage,
        'progress.openedCourses': completedCourses,
        'progress.completedExams': completedExams,
        'progress.scores': scores,
      };

      await userRef.update(updateData);
      
      console.log(`✅ Updated user achievements: ${completedCourses.length} courses completed`);
      return await this.findById(userId);
    } catch (error) {
      console.error('Error updating user achievements:', error);
      throw error;
    }
  }

  // Batch update all users with realistic data
  static async updateAllUsersWithRealisticData(): Promise<void> {
    try {
      console.log('🔄 Updating all users with realistic achievement data...');
      
      const querySnapshot = await this.collection.get();
      
      const userData = [
        { serial: "112", completedCourses: [1, 2, 3, 4, 5, 6] }, // 6 دورات مكتملة
        { serial: "101", completedCourses: [1, 2, 3] }, // 3 دورات مكتملة  
        { serial: "105", completedCourses: [1] }, // دورة واحدة مكتملة
      ];
      
      for (const doc of querySnapshot.docs) {
        const docData = doc.data();
        const userConfig = userData.find(u => u.serial === docData.serial);
        
        if (userConfig) {
          const completedCourses = userConfig.completedCourses;
          const completedCount = completedCourses.length;
          const currentStage =
            completedCount >= 8
              ? 8
              : completedCount === 7
              ? 7.5
              : completedCount + 1;
          const scores = completedCourses.map(() => Math.floor(Math.random() * 30) + 70);
          
          await doc.ref.update({
            currentStage: currentStage,
            progress: {
              openedCourses: completedCourses,
              completedExams: completedCourses,
              scores: scores,
            }
          });
          
          console.log(`✅ Updated ${docData.name}: ${completedCourses.length} courses completed, stage ${currentStage}`);
        }
      }
      
      console.log('🎉 All users updated with realistic data!');
    } catch (error) {
      console.error('Error updating users with realistic data:', error);
      throw error;
    }
  }

}
