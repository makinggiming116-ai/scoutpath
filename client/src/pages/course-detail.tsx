import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Download, 
  Lock, 
  FileText, 
  ClipboardList, 
  Award,
  Loader2 
} from "lucide-react";
import type { User } from "@shared/schema";
import { courses, convertDriveUrl } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function CourseDetail() {
  const [, params] = useRoute("/course/:id");
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const courseId = params?.id ? parseInt(params.id) : 0;
  const course = courses.find((c) => c.id === courseId);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  useEffect(() => {
    // Simulate loading for iframe
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [courseId]);

  if (!user || !course) {
    return null;
  }

  const isUnlocked = courseId <= user.stage;
  const isCompleted = user.completedCourses.includes(courseId);

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">دورة مقفلة</h2>
          <p className="text-muted-foreground">
            هذه الدورة غير متاحة حالياً. سيتم فتحها عند وصولك للمرحلة {courseId}
          </p>
          <Button onClick={() => setLocation("/dashboard")} className="w-full">
            <ArrowRight className="w-5 h-5 ml-2" />
            العودة للوحة التحكم
          </Button>
        </Card>
      </div>
    );
  }

  const handleDownload = () => {
    window.open(course.pdfUrl, '_blank');
    toast({
      title: "جاري التنزيل",
      description: "سيتم فتح الملف في نافذة جديدة",
    });
  };

  const pdfEmbedUrl = convertDriveUrl(course.pdfUrl);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-back-to-dashboard"
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              العودة
            </Button>
            <div className="flex-1 min-w-0 text-center">
              <h1 className="text-lg md:text-xl font-bold truncate" data-testid="text-course-title">
                {course.title}
              </h1>
            </div>
            <div className="flex-shrink-0">
              {isCompleted && (
                <Badge variant="secondary" className="bg-chart-4/10 text-chart-4 border-chart-4/20">
                  مكتملة
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 pb-8">
        <Tabs defaultValue="training" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="training" className="gap-2" data-testid="tab-training">
              <FileText className="w-4 h-4" />
              الدورة التدريبية
            </TabsTrigger>
            <TabsTrigger value="exams" className="gap-2" data-testid="tab-exams">
              <ClipboardList className="w-4 h-4" />
              الامتحانات
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2" data-testid="tab-certificates">
              <Award className="w-4 h-4" />
              الشهادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="training" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">محتوى الدورة</h3>
                <Button 
                  onClick={handleDownload} 
                  variant="outline" 
                  size="sm"
                  data-testid="button-download-pdf"
                >
                  <Download className="w-4 h-4 ml-2" />
                  تنزيل الملف
                </Button>
              </div>

              <div className="relative bg-muted rounded-lg overflow-hidden" style={{ minHeight: '70vh' }}>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground">جاري تحميل المحتوى...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={pdfEmbedUrl}
                  className="w-full h-full"
                  style={{ minHeight: '70vh', border: 'none' }}
                  title={course.title}
                  data-testid="iframe-pdf-viewer"
                  onLoad={() => setIsLoading(false)}
                />
              </div>

              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm text-muted-foreground text-center">
                  إذا لم يظهر الملف أعلاه، يمكنك تنزيله مباشرة باستخدام زر "تنزيل الملف"
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="exams">
            <Card className="p-12 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center">
                <Lock className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">قسم الامتحانات</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                هذا القسم محجوز للمستقبل. سيتم إضافة الامتحانات قريباً من قبل المسؤول.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="certificates">
            <Card className="p-12 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center">
                <Lock className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">قسم الشهادات</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                هذا القسم محجوز للمستقبل. ستظهر الشهادات هنا بعد اجتياز الامتحانات.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
