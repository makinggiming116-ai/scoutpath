import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Lock, 
  CheckCircle2, 
  Circle, 
  Award, 
  BookOpen, 
  TrendingUp,
  LogOut,
  Tent
} from "lucide-react";
import type { User } from "@shared/schema";
import { courses } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setLocation("/");
  };

  if (!user) return null;

  const totalCourses = 8;
  const completedCount = user.completedCourses.length;
  const certificatesCount = user.certificates.length;
  const progressPercentage = Math.round((completedCount / totalCourses) * 100);

  const isCourseUnlocked = (courseId: number) => {
    return courseId <= user.stage;
  };

  const isCourseCompleted = (courseId: number) => {
    return user.completedCourses.includes(courseId);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Tent className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">أهلاً</p>
                <h2 className="text-lg font-bold" data-testid="text-dashboard-user-name">{user.name}</h2>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-8">
        {/* Title Section */}
        <div className="text-center space-y-2 pt-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            المسار التدريبي
          </h1>
          <p className="text-xl font-semibold text-primary">2025-2030</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <BookOpen className="w-5 h-5 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-courses">{totalCourses}</p>
                <p className="text-xs text-muted-foreground">عدد الدورات</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-completed-courses">{completedCount}</p>
                <p className="text-xs text-muted-foreground">دورات مكتملة</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Award className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-certificates-count">{certificatesCount}</p>
                <p className="text-xs text-muted-foreground">شهادات</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="w-5 h-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-progress-percentage">{progressPercentage}%</p>
                <p className="text-xs text-muted-foreground">الإنجاز</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">التقدم الإجمالي</h3>
              <span className="text-sm font-medium">{completedCount} من {totalCourses}</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </Card>

        {/* Courses List */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold">الدورات التدريبية</h2>
          
          <div className="space-y-3">
            {courses.map((course) => {
              const unlocked = isCourseUnlocked(course.id);
              const completed = isCourseCompleted(course.id);

              return (
                <Card
                  key={course.id}
                  className={`overflow-hidden transition-all ${
                    !unlocked ? 'opacity-50' : 'hover-elevate cursor-pointer'
                  }`}
                  onClick={() => unlocked && setLocation(`/course/${course.id}`)}
                  data-testid={`card-course-${course.id}`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        completed ? 'bg-chart-4/10' : unlocked ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        {completed ? (
                          <CheckCircle2 className="w-6 h-6 text-chart-4" />
                        ) : unlocked ? (
                          <Circle className="w-6 h-6 text-primary" />
                        ) : (
                          <Lock className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-foreground leading-tight">
                            {course.title}
                          </h3>
                          {completed && (
                            <Badge variant="secondary" className="bg-chart-4/10 text-chart-4 border-chart-4/20 flex-shrink-0">
                              مكتملة
                            </Badge>
                          )}
                          {!unlocked && (
                            <Badge variant="secondary" className="flex-shrink-0">
                              مقفلة
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {unlocked 
                            ? completed 
                              ? 'تم إكمال هذه الدورة بنجاح' 
                              : 'اضغط لبدء الدورة'
                            : `يتم فتحها في المرحلة ${course.id}`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
