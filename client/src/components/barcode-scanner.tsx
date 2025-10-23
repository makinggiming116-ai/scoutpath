import { useRef, useState } from "react";
import { Upload, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import jsQR from "jsqr";

interface BarcodeScannerProps {
  onScan: (barcodeNumber: string) => void;
  isLoading?: boolean;
}

export function BarcodeScanner({ onScan, isLoading }: BarcodeScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process barcode
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setError('فشل معالجة الصورة');
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        onScan(code.data);
      } else {
        setError('لم يتم العثور على باركود في الصورة. يرجى التأكد من وضوح الصورة والمحاولة مرة أخرى.');
      }
    };

    const imgReader = new FileReader();
    imgReader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    imgReader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4" dir="rtl">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-barcode-file"
      />

      <Card 
        className="border-2 border-dashed hover-elevate cursor-pointer transition-all duration-200"
        onClick={handleClick}
        data-testid="card-barcode-upload"
      >
        <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
          {previewUrl ? (
            <div className="w-full max-w-xs">
              <img 
                src={previewUrl} 
                alt="Barcode preview" 
                className="w-full h-auto rounded-md"
              />
            </div>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  ارفع صورة الباركود
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  اضغط هنا لالتقاط صورة أو اختيار صورة من المعرض
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg" data-testid="text-barcode-error">
          <p className="text-sm text-destructive text-center">{error}</p>
        </div>
      )}

      <Button
        onClick={handleClick}
        disabled={isLoading}
        className="w-full"
        size="lg"
        data-testid="button-upload-barcode"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            جاري التحقق...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 ml-2" />
            {previewUrl ? 'اختيار صورة أخرى' : 'رفع صورة الباركود'}
          </>
        )}
      </Button>
    </div>
  );
}
