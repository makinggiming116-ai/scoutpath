import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { apiRequest } from "@/lib/queryClient";
import { courseExams } from "@/lib/exams";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function CourseDetail() {
  const [, params] = useRoute("/course/:id");
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [examSchedule, setExamSchedule] = useState<{ openAt: number; closeAt: number } | null>(null);
  const [examWindowRemainingSeconds, setExamWindowRemainingSeconds] = useState<number | null>(null);
  const [examWindowMode, setExamWindowMode] = useState<"before_open" | "open" | "closed">("closed");

  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [examPageIndex, setExamPageIndex] = useState(0);
  const [examRemainingSeconds, setExamRemainingSeconds] = useState<number | null>(null);
  const [examResult, setExamResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [examCooldownUntil, setExamCooldownUntil] = useState<number | null>(null);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState<number | null>(null);

  const examAnswersRef = useRef<Record<number, number>>({});

  const courseId = params?.id ? parseInt(params.id) : 0;
  const course = courses.find((c) => c.id === courseId);
  const courseExam = courseExams[courseId];

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      try {
        const res = await apiRequest("GET", `/api/users/${user.id}`);
        const data = await res.json();
        if (data?.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
          setUser(data.user);
        }
      } catch {
        return;
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    examAnswersRef.current = examAnswers;
  }, [examAnswers]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [courseId]);

  useEffect(() => {
    const scheduleRef = doc(db, "settings", "examSchedule");

    const unsub = onSnapshot(
      scheduleRef,
      (snap) => {
        if (!snap.exists()) {
          setExamSchedule(null);
          return;
        }
        const data: any = snap.data();

        const coerceMillis = (v: any): number | null => {
          if (typeof v === "number") return v;
          if (v && typeof v.toMillis === "function") return v.toMillis();
          if (v && typeof v.seconds === "number") return v.seconds * 1000;
          return null;
        };

        const openAt = coerceMillis(data.openAt);
        const closeAt = coerceMillis(data.closeAt);
        if (typeof openAt === "number" && typeof closeAt === "number" && closeAt > openAt) {
          setExamSchedule({ openAt, closeAt });
          return;
        }

        setExamSchedule(null);
      },
      () => {
        return;
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const tick = () => {
      if (!examSchedule) {
        setExamWindowMode("closed");
        setExamWindowRemainingSeconds(null);
        return;
      }

      const nowMs = Date.now();
      const beforeOpen = nowMs < examSchedule.openAt;
      const afterClose = nowMs >= examSchedule.closeAt;

      if (beforeOpen) {
        const remaining = Math.ceil((examSchedule.openAt - nowMs) / 1000);
        setExamWindowMode("before_open");
        setExamWindowRemainingSeconds(remaining > 0 ? remaining : null);
        return;
      }

      if (afterClose) {
        setExamWindowMode("closed");
        setExamWindowRemainingSeconds(null);
        return;
      }

      const remaining = Math.ceil((examSchedule.closeAt - nowMs) / 1000);
      setExamWindowMode("open");
      setExamWindowRemainingSeconds(remaining > 0 ? remaining : null);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [examSchedule]);

  useEffect(() => {
    if (!courseExam) return;
    if (!examStartedAt) return;
    if (examResult) return;
    if (!examSchedule) return;
    const nowMs = Date.now();
    if (nowMs < examSchedule.openAt) return;

    const msUntilClose = examSchedule.closeAt - nowMs;
    if (msUntilClose <= 0) {
      submitExam();
      return;
    }

    const timeout = setTimeout(() => {
      submitExam();
    }, msUntilClose);

    return () => clearTimeout(timeout);
  }, [courseExam, examResult, examSchedule, examStartedAt]);

  const examStorageKey = user ? `courseExam:${user.id}:${courseId}` : null;

  const formatSeconds = (totalSeconds: number) => {
    const clamped = Math.max(totalSeconds, 0);
    const hh = Math.floor(clamped / 3600);
    const mm = Math.floor((clamped % 3600) / 60);
    const ss = clamped % 60;
    return `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const formatDateTime = (ms: number) => {
    try {
      return new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(ms));
    } catch {
      return new Date(ms).toLocaleString();
    }
  };

  const loadExamState = () => {
    try {
      if (!examStorageKey) return;
      const raw = localStorage.getItem(examStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      if (typeof parsed.startedAt === "number") setExamStartedAt(parsed.startedAt);
      if (typeof parsed.cooldownUntil === "number") {
        if (parsed.cooldownUntil > Date.now()) setExamCooldownUntil(parsed.cooldownUntil);
      }
      if (parsed.answers && typeof parsed.answers === "object") setExamAnswers(parsed.answers);
      if (parsed.result && typeof parsed.result === "object") {
        if (typeof parsed.result.score === "number" && typeof parsed.result.passed === "boolean") {
          setExamResult({ score: parsed.result.score, passed: parsed.result.passed });
        }
      }
      if (typeof parsed.pageIndex === "number") setExamPageIndex(parsed.pageIndex);
    } catch {
      return;
    }
  };

  const persistExamState = (next: {
    startedAt: number | null;
    cooldownUntil: number | null;
    answers: Record<number, number>;
    result: { score: number; passed: boolean } | null;
    pageIndex: number;
  }) => {
    if (!examStorageKey) return;
    localStorage.setItem(examStorageKey, JSON.stringify(next));
  };

  const currentStage = user?.currentStage || 1;
  const unlockStage = currentStage === 7.5 ? 8 : currentStage;
  const inProgressCourseId = currentStage === 7.5 ? 8 : currentStage < 8 ? currentStage : null;

  const isUnlocked = courseId <= unlockStage;
  const isCompleted =
    (user?.progress.completedExams || []).includes(courseId) ||
    courseId < currentStage ||
    (currentStage >= 8 && courseId === 8);
  const isInProgress = inProgressCourseId !== null && courseId === inProgressCourseId;

  const isCooldownActive = examCooldownUntil !== null && Date.now() < examCooldownUntil;

  useEffect(() => {
    if (!examCooldownUntil) {
      setCooldownRemainingSeconds(null);
      return;
    }

    const tick = () => {
      const remaining = Math.ceil((examCooldownUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setExamCooldownUntil(null);
        setCooldownRemainingSeconds(null);
        return;
      }
      setCooldownRemainingSeconds(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [examCooldownUntil]);

  useEffect(() => {
    if (!courseExam) return;
    if (!user) return;
    loadExamState();
  }, [courseId, courseExam, user]);

  useEffect(() => {
    if (!courseExam) return;
    if (!user) return;
    persistExamState({
      startedAt: examStartedAt,
      cooldownUntil: examCooldownUntil,
      answers: examAnswers,
      result: examResult,
      pageIndex: examPageIndex,
    });
  }, [
    courseExam,
    examStorageKey,
    examAnswers,
    examCooldownUntil,
    examPageIndex,
    examResult,
    examStartedAt,
  ]);

  useEffect(() => {
    if (!courseExam) return;
    if (!examStartedAt) {
      setExamRemainingSeconds(null);
      return;
    }
    if (examResult) return;

    const tick = () => {
      const elapsedSeconds = Math.floor((Date.now() - examStartedAt) / 1000);
      const remaining = courseExam.durationMinutes * 60 - elapsedSeconds;
      setExamRemainingSeconds(remaining);

      if (remaining <= 0) {
        submitExam();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [courseExam, examResult, examStartedAt]);

  const startExam = () => {
    if (!courseExam) return;
    if (!user) return;
    if (isCompleted) return;
    if (isCooldownActive) return;

    if (examWindowMode === "before_open") {
      toast({
        title: "الامتحانات غير متاحة حالياً",
        description: `سيتم فتح الامتحانات في: ${formatDateTime(examSchedule?.openAt ?? Date.now())}`,
        variant: "destructive",
      });
      return;
    }

    if (examWindowMode === "closed") {
      toast({
        title: "تم إنهاء الامتحان",
        description: "الامتحانات مغلقة الآن.",
        variant: "destructive",
      });
      return;
    }

    setExamResult(null);
    setExamAnswers({});
    setExamPageIndex(0);
    setExamStartedAt(Date.now());
  };

  const submitExam = async () => {
    if (!courseExam) return;
    if (!user) return;
    if (examResult) return;

    const score = courseExam.questions.reduce((acc, q, idx) => {
      const selected = examAnswersRef.current[idx];
      if (typeof selected === "number" && selected === q.correctIndex) return acc + 1;
      return acc;
    }, 0);

    const passed = score >= courseExam.passScore;
    setExamResult({ score, passed });
    setExamStartedAt(null);
    setExamRemainingSeconds(null);

    if (!passed) {
      const until = Date.now() + courseExam.cooldownMinutes * 60 * 1000;
      setExamCooldownUntil(until);
      toast({
        title: "نتيجة الامتحان",
        description: `للأسف رسبت. نتيجتك ${score} من ${courseExam.questions.length}. سيتم فتح الامتحان بعد ساعتين.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("PATCH", `/api/users/${user.id}/progress`, {
        completedExams: [courseId],
      });
      const data = await response.json();

      if (data.user) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        setUser(data.user);
      }

      toast({
        title: "مبروك!",
        description: `نجحت في الامتحان. نتيجتك ${score} من ${courseExam.questions.length}.`,
      });
    } catch (error: any) {
      toast({
        title: "تم النجاح لكن حدث خطأ",
        description: error?.message || "فشل تحديث بيانات النجاح على السيرفر",
        variant: "destructive",
      });
    }
  };

  if (!user || !course) {
    return null;
  }

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
              {!isCompleted && isInProgress && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black border-0 shadow-lg font-bold">
                  جاري الدراسة
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
            {!courseExam ? (
              <Card className="p-10 text-center space-y-6 bg-gradient-to-br from-card to-muted/10 border-2 border-muted shadow-xl">
                <div className="w-24 h-24 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                  <Lock className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">قسم الامتحانات</h3>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    لا يوجد امتحان متاح لهذه الدورة حالياً.
                  </p>
                </div>
              </Card>
            ) : isCompleted ? (
              <Card className="p-10 text-center space-y-7 bg-gradient-to-br from-card to-chart-4/10 border-2 border-chart-4/30 shadow-2xl">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-chart-4/30 to-primary/10 mx-auto flex items-center justify-center border-2 border-chart-4/30 shadow-lg">
                  <Award className="w-12 h-12 text-chart-4" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black">لقد تم اكمال هذه الدورة بنجاح</h3>
                  <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed font-medium">
                    تم تسجيل نجاحك. يمكنك مشاهدة شهادتك من تبويب الشهادات.
                  </p>
                </div>
              </Card>
            ) : examWindowMode === "before_open" ? (
              <Card className="p-10 text-center space-y-6 bg-gradient-to-br from-card to-muted/10 border-2 border-muted shadow-xl">
                <div className="w-24 h-24 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                  <Lock className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">الامتحانات ستُفتح قريباً</h3>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    موعد فتح الامتحانات: {formatDateTime(examSchedule?.openAt ?? Date.now())}
                  </p>
                  <p className="text-3xl font-black text-primary">{formatSeconds(examWindowRemainingSeconds ?? 0)}</p>
                </div>
              </Card>
            ) : examWindowMode === "closed" ? (
              <Card className="p-10 text-center space-y-6 bg-gradient-to-br from-card to-muted/10 border-2 border-muted shadow-xl">
                <div className="w-24 h-24 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                  <Lock className="w-12 h-12 text-muted-foreground" />
                </div>
                {examResult ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black">تم إنهاء الامتحان</h3>
                      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                        الامتحانات مغلقة الآن.
                      </p>
                    </div>
                    <Alert variant={examResult.passed ? "default" : "destructive"}>
                      <AlertTitle className="font-black">نتيجة الامتحان</AlertTitle>
                      <AlertDescription>
                        نتيجتك {examResult.score} من {courseExam.questions.length}.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : examStartedAt ? (
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black">انتهى وقت الامتحان</h3>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                      جاري تسليم الامتحان وحساب النتيجة...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black">تم إنهاء الامتحان</h3>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                      الامتحانات مغلقة الآن.
                    </p>
                  </div>
                )}
              </Card>
            ) : isCooldownActive ? (
              <Card className="p-10 text-center space-y-6 bg-gradient-to-br from-card to-muted/10 border-2 border-muted shadow-xl">
                <div className="w-24 h-24 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                  <Lock className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">الامتحان مقفول مؤقتاً</h3>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    يمكنك إعادة المحاولة بعد:
                  </p>
                  <p className="text-3xl font-black text-primary">{formatSeconds(cooldownRemainingSeconds ?? 0)}</p>
                </div>
              </Card>
            ) : examResult ? (
              <Card className="p-8 space-y-6 bg-gradient-to-br from-card to-muted/10 border-2 border-muted shadow-xl">
                <Alert variant={examResult.passed ? "default" : "destructive"}>
                  <AlertTitle className="font-black">نتيجة الامتحان</AlertTitle>
                  <AlertDescription>
                    نتيجتك {examResult.score} من {courseExam.questions.length}.
                  </AlertDescription>
                </Alert>
                {!examResult.passed && (
                  <Button
                    onClick={startExam}
                    className="w-full bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
                    size="lg"
                  >
                    إعادة المحاولة
                  </Button>
                )}
              </Card>
            ) : !examStartedAt ? (
              <Card className="p-8 space-y-6 bg-gradient-to-br from-card to-primary/5 border-2 border-primary/20 shadow-xl">
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">{courseExam.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    عدد الأسئلة: {courseExam.questions.length}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    زمن الامتحان: {courseExam.durationMinutes} دقيقة
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    النجاح من: {courseExam.passScore} من {courseExam.questions.length}
                  </p>
                </div>
                <Separator />
                <Button
                  onClick={startExam}
                  className="w-full bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
                  size="lg"
                  data-testid="button-start-exam"
                >
                  ابدأ الامتحان
                </Button>
              </Card>
            ) : (
              <Card className="p-6 space-y-6 bg-gradient-to-br from-card to-primary/5 border-2 border-primary/20 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">الوقت المتبقي</p>
                      <p className={`text-2xl font-black ${
                        (examRemainingSeconds ?? 0) <= 300 ? "text-destructive" : "text-foreground"
                      }`}>
                        {formatSeconds(examRemainingSeconds ?? courseExam.durationMinutes * 60)}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const ok = window.confirm("هل تريد تسليم الامتحان الآن؟ لا يمكنك الرجوع بعد التسليم.");
                        if (!ok) return;
                        submitExam();
                      }}
                      className="font-bold"
                      data-testid="button-submit-exam-early"
                    >
                      تسليم الامتحان
                    </Button>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground font-medium">تم الإجابة</p>
                      <p className="text-2xl font-black text-primary">
                        {Object.keys(examAnswers).length} / {courseExam.questions.length}
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={(Object.keys(examAnswers).length / courseExam.questions.length) * 100}
                    className="h-3 bg-muted/50"
                  />
                </div>

                <Separator />

                {(() => {
                  const pageSize = 5;
                  const totalPages = Math.ceil(courseExam.questions.length / pageSize);
                  const startIndex = examPageIndex * pageSize;
                  const endIndex = Math.min(startIndex + pageSize, courseExam.questions.length);
                  const pageQuestions = courseExam.questions.slice(startIndex, endIndex);

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground font-medium">
                          صفحة {examPageIndex + 1} من {totalPages}
                        </p>
                        <p className="text-sm text-muted-foreground font-medium">
                          الأسئلة {startIndex + 1} - {endIndex}
                        </p>
                      </div>

                      <div className="space-y-6">
                        {pageQuestions.map((q, localIdx) => {
                          const qIndex = startIndex + localIdx;
                          const selected = typeof examAnswers[qIndex] === "number" ? String(examAnswers[qIndex]) : undefined;
                          return (
                            <Card key={qIndex} className="p-5 border border-primary/20">
                              <div className="space-y-4">
                                <p className="font-bold leading-relaxed">
                                  {qIndex + 1}. {q.text}
                                </p>

                                <RadioGroup
                                  value={selected}
                                  onValueChange={(value) => {
                                    const idx = Number(value);
                                    if (Number.isNaN(idx)) return;
                                    setExamAnswers((prev) => ({ ...prev, [qIndex]: idx }));
                                  }}
                                  className="gap-3"
                                >
                                  {q.options.map((opt, optIdx) => {
                                    const id = `q-${qIndex}-opt-${optIdx}`;
                                    return (
                                      <div key={id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                                        <RadioGroupItem value={String(optIdx)} id={id} />
                                        <Label htmlFor={id} className="flex-1 cursor-pointer font-medium">
                                          {opt}
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </RadioGroup>
                              </div>
                            </Card>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => setExamPageIndex((p) => Math.max(p - 1, 0))}
                          disabled={examPageIndex === 0}
                          className="font-bold"
                        >
                          السابق
                        </Button>

                        {examPageIndex + 1 < totalPages ? (
                          <Button
                            onClick={() => setExamPageIndex((p) => Math.min(p + 1, totalPages - 1))}
                            className="bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
                          >
                            التالي
                          </Button>
                        ) : (
                          <Button
                            onClick={submitExam}
                            className="bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
                          >
                            تسليم الامتحان
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </Card>
            )}
          </TabsContent>

          <TabsContent value="certificates">
            {(() => {
              const canShowCertificate = isCompleted || examResult?.passed === true;
              const certificateSrc = `/${courseId}.jpg`;

              if (!courseExam) {
                return (
                  <Card className="p-16 text-center space-y-6 bg-gradient-to-br from-card to-muted/10 border-2 border-muted shadow-xl">
                    <div className="w-24 h-24 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                      <Lock className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black">لا توجد شهادة</h3>
                      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                        لا توجد شهادة متاحة لهذه الدورة.
                      </p>
                    </div>
                  </Card>
                );
              }

              if (!canShowCertificate) {
                return (
                  <Card className="p-16 text-center space-y-6 bg-gradient-to-br from-card to-muted/10 border-2 border-muted shadow-xl">
                    <div className="w-24 h-24 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                      <Lock className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black">الشهادة غير متاحة بعد</h3>
                      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                        ستظهر شهادتك هنا بعد اجتياز امتحان هذه الدورة.
                      </p>
                    </div>
                  </Card>
                );
              }

              return (
                <Card className="p-6 md:p-8 space-y-6 bg-gradient-to-br from-card to-primary/5 border-2 border-primary/20 shadow-xl">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl md:text-3xl font-black">شهادة إتمام الدورة</h3>
                    <p className="text-muted-foreground font-medium">{course.title}</p>
                  </div>

                  <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-2xl border-2 border-primary/20 shadow-2xl bg-muted/10">
                    <img
                      src={certificateSrc}
                      alt={`certificate-${courseId}`}
                      className="w-full h-auto block"
                      loading="lazy"
                    />

                    <div
                      className="absolute left-0 right-0 font-black pointer-events-none"
                      style={{ top: "46%" }}
                    >
                      <div className="mx-auto w-[92%]" dir="rtl">
                        <div
                          className="text-xl md:text-4xl leading-tight text-center"
                          style={{ color: "#1e3a8a", textShadow: "0 2px 10px rgba(255,255,255,0.8)", marginRight: "22%" }}
                        >
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
