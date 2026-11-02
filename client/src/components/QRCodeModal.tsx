/**
 * QRCodeModal — Generates a beautifully styled QR code for a URL or profile.
 * High-performance, anti-jitter, scroll-locked, rendered via React Portal directly into document.body.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Download, QrCode, X } from "lucide-react";
import { toast } from "sonner";

async function generateQR(text: string, canvas: HTMLCanvasElement) {
  try {
    const QRCode: any = await import("qrcode");
    await QRCode.toCanvas(canvas, text, {
      width: 220,
      margin: 1.5,
      color: {
        dark: "#2d1b4e",
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent background scroll smoothly
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    generateQR(url, canvas).then(() => setIsReady(true));
  }, [url, mounted]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "koharu-qr.png";
    a.click();
    toast.success("QR 코드 이미지를 저장했습니다.");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("링크가 복사되었습니다.");
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };

  if (!mounted) return null;

  // Render via React Portal to document.body to prevent parent transform/filter from breaking fixed positioning
  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 select-none overscroll-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full overflow-hidden border border-pink-200/80 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #faf5ff 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-2 border-b border-pink-100/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-md shadow-pink-500/20 text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#38314a]">프로필 공유 QR</div>
              <div className="text-[11px] text-[#7a6e8f] font-mono truncate max-w-[180px]">{label || url}</div>
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
        <div className="flex flex-col items-center px-6 py-5">
          <div
            className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-white p-2.5 flex items-center justify-center min-h-[230px] min-w-[230px]"
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
                <div className="text-pink-500 text-xs font-bold animate-pulse">QR 코드 생성 중...</div>
              </div>
            )}
          </div>

          {/* URL preview */}
          <div className="mt-4 w-full px-3 py-2 bg-white/90 rounded-xl text-[11px] text-[#7a6e8f] text-center font-mono break-all border border-pink-100 shadow-xs">
            {url}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-5 pt-1 border-t border-pink-100/60">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white hover:bg-pink-50 border border-pink-200 text-xs font-bold text-[#38314a] transition-colors cursor-pointer shadow-xs"
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
    </div>,
    document.body
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
