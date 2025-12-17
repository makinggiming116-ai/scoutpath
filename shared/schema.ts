import { z } from "zod";

// User Schema matching actual Firestore structure
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  serial: z.string(), // Changed from serialNumber to match Firestore
  currentStage: z
    .number()
    .min(1)
    .max(8)
    .refine((v) => Number.isInteger(v) || v === 7.5), // Changed from stage to match Firestore
  progress: z.object({
    openedCourses: z.array(z.number()).default([]),
    completedExams: z.array(z.number()).default([]),
    scores: z.array(z.number()).default([]),
  }).default({
    openedCourses: [],
    completedExams: [],
    scores: [],
  }),
});

export type User = z.infer<typeof userSchema>;

// Course Schema
export const courseSchema = z.object({
  id: z.number(),
  title: z.string(),
  pdfUrl: z.string(),
  examUrl: z.string().optional(),
  certificateUrl: z.string().optional(),
});

export type Course = z.infer<typeof courseSchema>;

// Login Request Schema
export const barcodeLoginSchema = z.object({
  barcodeNumber: z.string(),
});

export type BarcodeLogin = z.infer<typeof barcodeLoginSchema>;

// Course Content Sections
export type CourseSection = "training" | "exams" | "certificates";

// All 8 courses data
export const courses: Course[] = [
  {
    id: 1,
    title: "دورة تدريب الجوالة الجدد",
    pdfUrl: "https://drive.google.com/file/d/1KjzAiJ403DprvqFuTwjlJZwTqpZ9e2pf/view?usp=drive_link",
  },
  {
    id: 2,
    title: "دورة رواد الرهوط",
    pdfUrl: "https://drive.google.com/file/d/1ndlFTZcBQypQzJi2JdIT0PE-O9n1UbMF/view?usp=drive_link",
  },
  {
    id: 3,
    title: "دورة القادة المعلمين",
    pdfUrl: "https://drive.google.com/file/d/1KwzEP2S_xI2TC0iN0l018bzTzlsTSTeR/view?usp=drive_link",
  },
  {
    id: 4,
    title: "دورة إعداد مساعد قائد الفريق",
    pdfUrl: "https://drive.google.com/file/d/103h_rahd79TRBBjoer-IIbNJv3xfYZnr/view?usp=drive_link",
  },
  {
    id: 5,
    title: "دورة تأهيل قادة الفرق والمكاتب",
    pdfUrl: "https://drive.google.com/file/d/1YFgt7j88nFjh--njgAYFVTBRXQIvwvT4/view?usp=drive_link",
  },
  {
    id: 6,
    title: "دورة إعداد وتنفيذ البرامج الكشفية",
    pdfUrl: "https://drive.google.com/file/d/1ieo86RlTo_CdBdZ2vZ_G3CIHl2cyiI0i/view?usp=drive_link",
  },
  {
    id: 7,
    title: "دورة تدريب القادة العموم",
    pdfUrl: "https://drive.google.com/file/d/1QO7OTvYwsTr3jzNuz4rOexJ-wKcBNjVv/view?usp=drive_link",
  },
  {
    id: 8,
    title: "دورة قادة المجموعات الكشفية",
    pdfUrl: "https://drive.google.com/file/d/1ihfu0YXAwYxCGeDfwfoRm6h-AesQ-8Dn/view?usp=drive_link",
  },
];

// Helper function to convert Google Drive view link to embed/preview link
export function convertDriveUrl(url: string): string {
  const fileIdMatch = url.match(/\/d\/([^/]+)/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[1];
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return url;
}
