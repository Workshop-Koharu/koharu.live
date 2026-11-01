/**
 * QRCodeModal — Generates a beautifully styled QR code for a URL or profile.
 * High-performance, anti-jitter, scroll-locked, and fully isolated.
 */
import { useEffect, useRef, useState } from "react";
import { Copy, Download, QrCode, X } from "lucide-react";
import { toast } from "sonner";

async function generateQR(text: string, canvas: HTMLCanvasElement) {
  try {
    const QRCode: any = await import("qrcode");
    await QRCode.toCanvas(canvas, text, {
      width: 220,
      margin: 1.5,
      color: {
        dark: "#3b1f6a",
        light: "#ffffff",
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  // 1. Anti-jitter Scroll Lock with scrollbar width compensation
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // 2. Capture and prevent default wheel events directly to prevent background jitter
    const overlay = overlayRef.current;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    if (overlay) {
      overlay.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      if (overlay) {
        overlay.removeEventListener("wheel", handleWheel);
      }
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
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none"
      onClick={onClose}
      style={{
        overscrollBehavior: "none",
        touchAction: "none",
      }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-xs w-full overflow-hidden border border-pink-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #fdf2f8 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-md shadow-pink-500/20">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#38314a]">QR 코드</div>
              <div className="text-[11px] text-[#7a6e8f] font-mono truncate max-w-[150px]">{label || url}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Canvas */}
        <div className="flex flex-col items-center px-5 py-4">
          <div
            className="relative rounded-2xl overflow-hidden shadow-md border-4 border-white bg-white p-2 flex items-center justify-center min-h-[220px] min-w-[220px]"
          >
            <canvas
              ref={canvasRef}
              width={220}
              height={220}
              style={{
                display: "block",
                imageRendering: "pixelated",
                width: "220px",
                height: "220px",
              }}
            />
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                <div className="text-pink-500 text-xs font-bold animate-pulse">QR 코드 생성 중... 🌸</div>
              </div>
            )}
          </div>

          {/* URL preview */}
          <div className="mt-3.5 w-full px-3 py-2 bg-white/80 rounded-xl text-[11px] text-[#7a6e8f] text-center font-mono break-all border border-pink-100 shadow-inner">
            {url}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-5 pt-1">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white hover:bg-pink-50 border border-pink-200 text-xs font-bold text-[#38314a] transition-colors cursor-pointer shadow-sm"
          >
            <Copy className="w-3.5 h-3.5 text-pink-500" />
            링크 복사
          </button>
          <button
            onClick={handleDownload}
            disabled={!isReady}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-xs font-bold text-white shadow-md shadow-pink-500/25 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            이미지 저장
          </button>
        </div>
      </div>
    </div>
  );
}

// QR trigger button
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
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex items-center gap-1 text-xs font-bold transition-all cursor-pointer select-none ${resolvedClass}`}
        title="QR 코드 보기"
      >
        <QrCode className="w-3.5 h-3.5" />
        <span>QR</span>
      </button>
      {open && <QRCodeModal url={url} label={label} onClose={() => setOpen(false)} />}
    </>
  );
}
