/**
 * QRCodeModal — Generates a styled QR code for the profile or post URL.
 * Uses pure canvas QR code generation (no external package needed).
 */
import { useEffect, useRef, useState } from "react";
import { Copy, Download, QrCode, X } from "lucide-react";
import { toast } from "sonner";


// Minimal QR code generator using canvas (via a simple CDN-free approach)
// We'll use the qrcode library loaded from the package
async function generateQR(text: string, canvas: HTMLCanvasElement) {
  try {
    // Dynamically import qrcode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const QRCode: any = await import("qrcode");
    await QRCode.toCanvas(canvas, text, {
      width: 240,
      margin: 2,
      color: {
        dark: "#3b1f6a",
        light: "#fdf2f8",
      },
    });
  } catch (err) {
    console.error("QR generation failed:", err);
  }
}

interface QRCodeModalProps {
  url: string;
  label?: string;
  onClose: () => void;
}

export function QRCodeModal({ url, label, onClose }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Lock body scroll while modal is open to prevent screen jitter
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    generateQR(url, canvas).then(() => setIsReady(true));
  }, [url]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "koharu-qr.png";
    a.click();
    toast.success("QR 코드 이미지를 저장했습니다! 📷");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("링크가 복사되었습니다! 🔗");
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      style={{
        willChange: "transform",
        transform: "translateZ(0)",
        touchAction: "none",
        overscrollBehavior: "contain",
      }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-xs w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center shadow-md">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#38314a]">QR 코드</div>
              <div className="text-[10px] text-[#7a6e8f] font-mono truncate max-w-[150px]">{label || url}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Canvas */}
        <div className="flex flex-col items-center px-5 py-4">
          <div
            className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white"
            style={{ background: "#fdf2f8" }}
          >
            {/* Cherry blossom decoration */}
            <div className="absolute top-1 right-1 text-lg opacity-40 select-none pointer-events-none">🌸</div>
            <div className="absolute bottom-1 left-1 text-lg opacity-40 select-none pointer-events-none">🌸</div>

            <canvas
              ref={canvasRef}
              style={{
                display: "block",
                imageRendering: "pixelated",
              }}
            />
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#fdf2f8]">
                <div className="text-pink-400 text-sm font-bold animate-pulse">생성 중...</div>
              </div>
            )}
          </div>

          {/* URL preview */}
          <div className="mt-4 w-full px-3 py-2 bg-white/60 rounded-xl text-[11px] text-[#7a6e8f] text-center font-mono break-all border border-pink-100">
            {url}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-5 pt-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white/70 hover:bg-white border border-pink-200 text-xs font-bold text-[#38314a] transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-pink-500" />
            링크 복사
          </button>
          <button
            onClick={handleDownload}
            disabled={!isReady}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-xs font-bold text-white shadow-md shadow-pink-500/25 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}

// QR trigger button (small, inline)
interface QRButtonProps {
  url: string;
  label?: string;
  className?: string;
  buttonClassName?: string;
}

export function QRButton({ url, label, className = "", buttonClassName = "" }: QRButtonProps) {
  const [open, setOpen] = useState(false);
  const resolvedClass =
    buttonClassName ||
    className ||
    "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-white/80 border border-pink-100 text-pink-700 hover:bg-pink-50 transition-colors cursor-pointer";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${resolvedClass}`}
        title="QR 코드 생성"
      >
        <QrCode className="w-3.5 h-3.5" />
        QR
      </button>
      {open && <QRCodeModal url={url} label={label} onClose={() => setOpen(false)} />}
    </>
  );
}
