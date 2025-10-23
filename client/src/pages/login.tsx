import { useState } from "react";
import { useLocation } from "wouter";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Tent } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBarcodeScanned = async (barcodeNumber: string) => {
    setIsLoading(true);

    try {
      const response = await apiRequest<{ user: User }>(
        "POST",
        "/api/auth/barcode-login",
        { barcodeNumber }
      );

      if (response.user) {
        // Store user in session
        localStorage.setItem("currentUser", JSON.stringify(response.user));
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${response.user.name}`,
        });

        // Navigate to profile
        setLocation("/profile");
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "الرقم غير موجود في النظام. يرجى التواصل مع المسؤول.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col" dir="rtl">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                <Tent className="w-12 h-12 text-primary" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                المسار التدريبي للجوالة
              </h1>
              <p className="text-xl md:text-2xl font-semibold text-primary">
                2025-2030
              </p>
              <p className="text-base md:text-lg text-muted-foreground">
                رحلة إعداد القادة المستقبليين
              </p>
            </div>
          </div>

          {/* Login Section */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                تسجيل الدخول
              </h2>
              <p className="text-sm text-muted-foreground">
                من فضلك استخدم الباركود الخاص بك لاستكمال عملية تسجيل الدخول على المسار التدريبي
              </p>
            </div>

            <BarcodeScanner onScan={handleBarcodeScanned} isLoading={isLoading} />
          </div>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">
              مجموعة أولاد العذراء الكشفية والإرشادية
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
