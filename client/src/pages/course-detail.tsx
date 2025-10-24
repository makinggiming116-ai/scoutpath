import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Lock, 
  FileText, 
  ClipboardList, 
  Award,
  Loader2,
  Sparkles
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
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [courseId]);

  if (!user || !course) {
    return null;
  }

  const isUnlocked = courseId <= user.currentStage;
  const isCompleted = user.progress.completedExams.includes(courseId);

  if (!isUnlocked) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
        <Card className="relative max-w-md w-full p-10 text-center space-y-6 border-2 border-muted shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-muted mx-auto flex items-center justify-center">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black">دورة مقفلة</h2>
            <p className="text-muted-foreground leading-relaxed">
              هذه الدورة غير متاحة حالياً. سيتم فتحها عند وصولك للمرحلة {courseId}
            </p>
          </div>
          <Button onClick={() => setLocation("/dashboard")} className="w-full bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold" size="lg">
            <ArrowRight className="w-5 h-5 ml-2" />
            العودة للوحة التحكم
          </Button>
        </Card>
      </div>
    );
  }


  const pdfEmbedUrl = convertDriveUrl(course.pdfUrl);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-chart-2/5" />

      {/* Premium Sticky Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-card/90 border-b-2 border-primary/30 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="hover-elevate font-bold"
              data-testid="button-back-to-dashboard"
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              العودة
            </Button>
            <div className="flex-1 min-w-0 text-center flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
              <h1 className="text-lg md:text-2xl font-black truncate" data-testid="text-course-title">
                {course.title}
              </h1>
            </div>
            <div className="flex-shrink-0">
              {isCompleted && (
                <Badge className="bg-gradient-to-r from-chart-4 to-chart-4/80 text-white border-0 shadow-lg font-bold">
                  مكتملة
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto p-4 pb-12">
        <Tabs defaultValue="training" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-sm p-1.5 border-2 border-primary/20 shadow-lg">
            <TabsTrigger value="training" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-4 data-[state=active]:text-white font-bold transition-all" data-testid="tab-training">
              <FileText className="w-4 h-4" />
              الدورة التدريبية
            </TabsTrigger>
            <TabsTrigger value="exams" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-4 data-[state=active]:text-white font-bold transition-all" data-testid="tab-exams">
              <ClipboardList className="w-4 h-4" />
              الامتحانات
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-4 data-[state=active]:text-white font-bold transition-all" data-testid="tab-certificates">
              <Award className="w-4 h-4" />
              الشهادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="training" className="space-y-5">
            <Card className="p-6 border-2 border-primary/30 shadow-xl bg-gradient-to-br from-card to-primary/5">
              <div className="mb-5">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  محتوى الدورة
                </h3>
              </div>

              <div className="relative bg-muted/30 rounded-xl overflow-hidden border-2 border-primary/20 shadow-inner" style={{ minHeight: '70vh' }}>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-card to-primary/10 z-10">
                    <div className="text-center space-y-4">
                      <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground font-medium">جاري تحميل المحتوى...</p>
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

            </Card>
          </TabsContent>

          <TabsContent value="exams">
            <Card className="p-16 text-center space-y-6 bg-gradient-to-br from-card to-muted/10 border-2 border-muted shadow-xl">
              <div className="w-24 h-24 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                <Lock className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black">قسم الامتحانات</h3>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  هذا القسم محجوز للمستقبل. سيتم إضافة الامتحانات قريباً من قبل المسؤول.
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="certificates">
            <Card className="p-16 text-center space-y-6 bg-gradient-to-br from-card to-muted/10 border-2 border-muted shadow-xl">
              <div className="w-24 h-24 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                <Award className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black">قسم الشهادات</h3>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  هذا القسم محجوز للمستقبل. ستظهر الشهادات هنا بعد اجتياز الامتحانات.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
