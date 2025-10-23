import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Tent, User as UserIcon, Award } from "lucide-react";
import type { User } from "@shared/schema";

export default function Profile() {
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

  if (!user) return null;

  const stageNames = [
    "دورة تدريب الجوالة الجدد",
    "دورة رواد الرهوط",
    "دورة القادة المعلمين",
    "دورة إعداد مساعد قائد الفريق",
    "دورة تأهيل قادة الفرق والمكاتب",
    "دورة إعداد وتنفيذ البرامج الكشفية",
    "دورة تدريب القادة العموم",
    "دورة قادة المجموعات الكشفية"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5" dir="rtl">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header with Logo */}
        <div className="text-center space-y-4 pt-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
              <Tent className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-muted-foreground">
            مجموعة أولاد العذراء الكشفية والإرشادية
          </h2>
        </div>

        {/* ID Card */}
        <Card className="overflow-hidden border-2 shadow-lg">
          <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center border-2 border-primary-foreground/30">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold" data-testid="text-user-name">{user.name}</h3>
                  <p className="text-primary-foreground/80 text-sm">المسار التدريبي 2025-2030</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">الرقم التسلسلي</p>
                <p className="text-lg font-semibold" data-testid="text-serial-number">{user.serialNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">المرحلة الحالية</p>
                <Badge variant="secondary" className="text-sm px-3 py-1" data-testid="badge-current-stage">
                  المرحلة {user.stage}
                </Badge>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Award className="w-4 h-4" />
                <span>المستوى الحالي</span>
              </div>
              <p className="font-medium text-foreground" data-testid="text-current-level">
                {stageNames[user.stage - 1]}
              </p>
            </div>
          </div>
        </Card>

        {/* Start Button */}
        <Button
          onClick={() => setLocation("/dashboard")}
          size="lg"
          className="w-full text-lg"
          data-testid="button-start-training"
        >
          بدء المسار التدريبي
          <ArrowLeft className="w-5 h-5 mr-2 rotate-180" />
        </Button>
      </div>
    </div>
  );
}
