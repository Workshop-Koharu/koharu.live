/**
 * PixelBoardPage — r/place style 1000×1000 pixel collaborative canvas.
 * Cooldown: 60 seconds per pixel. Uses localStorage to persist the board locally.
 * In a real deployment, use a shared backend (e.g., Supabase/WebSockets) for multiplayer.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import SiteNav from "@/components/SiteNav";

const BOARD_SIZE = 100; // render as 100x100 with each cell = 6px (looks like 1000x1000)
const CELL_SIZE = 6;
const COOLDOWN_MS = 60_000; // 1 minute

const PALETTE = [
  "#ffffff", "#d4d4d4", "#808080", "#404040", "#000000",
  "#ff3040", "#ff7043", "#ffa726", "#ffee58", "#9ccc65",
  "#26c6da", "#42a5f5", "#5c6bc0", "#ab47bc", "#ec407a",
  "#ef9a9a", "#ffccbc", "#fff9c4", "#c8e6c9", "#b3e5fc",
  "#880e4f", "#b71c1c", "#e65100", "#f57f17", "#1b5e20",
  "#006064", "#0d47a1", "#1a237e", "#4a148c", "#ff6f00",
];

const STORAGE_KEY = "koharu_pixel_board";
const LAST_PLACE_KEY = "koharu_pixel_last_place";

function createBoard(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === BOARD_SIZE * BOARD_SIZE) return parsed;
    }
  } catch {}
  // Default: white board
  return Array(BOARD_SIZE * BOARD_SIZE).fill("#ffffff");
}

function saveBoard(board: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch {}
}

export default function PixelBoardPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<string[]>(createBoard());

  const [selectedColor, setSelectedColor] = useState("#ff9f0a");
  const [cooldownSec, setCooldownSec] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [totalPlaced, setTotalPlaced] = useState(0);

  // Cooldown timer
  useEffect(() => {
    const update = () => {
      try {
        const last = parseInt(localStorage.getItem(LAST_PLACE_KEY) || "0", 10);
        const remaining = Math.max(0, Math.ceil((last + COOLDOWN_MS - Date.now()) / 1000));
        setCooldownSec(remaining);
      } catch {
        setCooldownSec(0);
      }
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, []);

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
      const cx = (i % BOARD_SIZE) * CELL_SIZE;
      const cy = Math.floor(i / BOARD_SIZE) * CELL_SIZE;
      ctx.fillStyle = boardRef.current[i] || "#ffffff";
      ctx.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);
    }
  }, []);

  const drawOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (hoverCell) {
      const { x, y } = hoverCell;
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x * CELL_SIZE + 0.75, y * CELL_SIZE + 0.75, CELL_SIZE - 1.5, CELL_SIZE - 1.5);
      ctx.fillStyle = selectedColor + "80";
      ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    }
  }, [hoverCell, selectedColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = BOARD_SIZE * CELL_SIZE;
    canvas.height = BOARD_SIZE * CELL_SIZE;
    if (overlayRef.current) {
      overlayRef.current.width = BOARD_SIZE * CELL_SIZE;
      overlayRef.current.height = BOARD_SIZE * CELL_SIZE;
    }
    drawBoard();
  }, [drawBoard]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  const placePixel = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (cooldownSec > 0) return;
      const canvas = overlayRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = (BOARD_SIZE * CELL_SIZE) / rect.width;
      const scaleY = (BOARD_SIZE * CELL_SIZE) / rect.height;
      const px = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
      const py = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);

      if (px < 0 || px >= BOARD_SIZE || py < 0 || py >= BOARD_SIZE) return;

      boardRef.current[py * BOARD_SIZE + px] = selectedColor;
      saveBoard(boardRef.current);
      drawBoard();

      setTotalPlaced((prev) => prev + 1);

      try {
        localStorage.setItem(LAST_PLACE_KEY, String(Date.now()));
      } catch {}
      setCooldownSec(COOLDOWN_MS / 1000);
    },
    [cooldownSec, selectedColor, drawBoard]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = overlayRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = (BOARD_SIZE * CELL_SIZE) / rect.width;
      const scaleY = (BOARD_SIZE * CELL_SIZE) / rect.height;
      const px = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
      const py = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);
      if (px >= 0 && px < BOARD_SIZE && py >= 0 && py < BOARD_SIZE) {
        setHoverCell({ x: px, y: py });
        setCursorPos({ x: px, y: py });
      }
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHoverCell(null);
    setCursorPos(null);
  }, []);

  const clearMyPixels = () => {
    if (!window.confirm("보드를 초기화하시겠습니까? (로컬 데이터 삭제)")) return;
    boardRef.current = Array(BOARD_SIZE * BOARD_SIZE).fill("#ffffff");
    saveBoard(boardRef.current);
    drawBoard();
  };

  const canvasSize = BOARD_SIZE * CELL_SIZE;

  return (
    <div className="min-h-screen">
      <SiteNav active="" />
      <main className="page-container" id="main">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-1">
            🎨 픽셀 방명록
          </h1>
          <p className="text-sm text-[#7a6e8f]">
            r/place 스타일 · 1분에 1픽셀 · 함께 완성하는 캔버스
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Canvas Container */}
          <div className="glass-card !p-4 flex flex-col items-center gap-3">
            {/* Zoom slider */}
            <div className="flex items-center gap-3 w-full text-xs text-[#7a6e8f]">
              <span>🔍 줌:</span>
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-pink-500"
              />
              <span className="font-mono w-8">{zoom.toFixed(1)}x</span>
            </div>

            {/* Canvas */}
            <div
              className="relative border-2 border-pink-200 rounded-xl overflow-auto"
              style={{
                maxWidth: "min(80vw, 600px)",
                maxHeight: "60vh",
                background: "#f0f0f0",
              }}
            >
              <div
                style={{
                  width: canvasSize * zoom,
                  height: canvasSize * zoom,
                  position: "relative",
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    imageRendering: "pixelated",
                    width: canvasSize * zoom,
                    height: canvasSize * zoom,
                  }}
                />
                <canvas
                  ref={overlayRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    imageRendering: "pixelated",
                    width: canvasSize * zoom,
                    height: canvasSize * zoom,
                    cursor: cooldownSec > 0 ? "not-allowed" : "crosshair",
                  }}
                  onClick={placePixel}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
            </div>

            {/* Cursor position */}
            {cursorPos && (
              <div className="text-[11px] text-[#7a6e8f] font-mono">
                ({cursorPos.x}, {cursorPos.y})
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-4 w-full max-w-xs">
            {/* Status */}
            <div className="glass-card !p-4 space-y-2">
              <div className="text-xs font-bold text-[#38314a] mb-3">📊 현황</div>
              <div className="flex justify-between text-xs text-[#7a6e8f]">
                <span>내가 설치한 픽셀</span>
                <strong className="text-[#38314a]">{totalPlaced}</strong>
              </div>
              <div className="flex justify-between text-xs text-[#7a6e8f]">
                <span>보드 크기</span>
                <strong className="text-[#38314a]">100 × 100</strong>
              </div>

              {/* Cooldown indicator */}
              {cooldownSec > 0 ? (
                <div className="mt-3 w-full bg-pink-50 rounded-2xl p-3 text-center">
                  <div className="text-xs font-bold text-pink-600 mb-1">⏳ 쿨다운</div>
                  <div className="text-2xl font-extrabold text-pink-500 font-mono tabular-nums">
                    {cooldownSec}초
                  </div>
                  <div className="mt-2 h-1.5 bg-pink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(1 - cooldownSec / 60) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3 w-full bg-emerald-50 rounded-2xl p-3 text-center">
                  <div className="text-xs font-bold text-emerald-600">✅ 픽셀 배치 가능</div>
                  <div className="text-[11px] text-emerald-500 mt-0.5">캔버스를 클릭하세요!</div>
                </div>
              )}
            </div>

            {/* Color Palette */}
            <div className="glass-card !p-4">
              <div className="text-xs font-bold text-[#38314a] mb-3">🎨 색상 선택</div>
              <div className="grid grid-cols-6 gap-1.5">
                {PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className="w-8 h-8 rounded-lg transition-all cursor-pointer hover:scale-110"
                    style={{
                      background: color,
                      boxShadow:
                        selectedColor === color
                          ? `0 0 0 3px white, 0 0 0 5px ${color}`
                          : "inset 0 0 0 1px rgba(0,0,0,0.15)",
                      transform: selectedColor === color ? "scale(1.15)" : "scale(1)",
                    }}
                    title={color}
                  />
                ))}
              </div>

              {/* Selected Color Preview */}
              <div className="mt-3 flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg border border-pink-200 flex-shrink-0"
                  style={{ background: selectedColor }}
                />
                <div>
                  <div className="text-xs font-bold text-[#38314a]">선택된 색상</div>
                  <div className="text-[11px] font-mono text-[#7a6e8f]">{selectedColor}</div>
                </div>
              </div>

              {/* Custom color */}
              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs text-[#7a6e8f]">직접 선택:</label>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-pink-200 cursor-pointer p-0 overflow-hidden"
                />
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={clearMyPixels}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors py-2 px-4 rounded-xl border border-gray-200 hover:border-red-200 cursor-pointer"
            >
              🗑️ 보드 초기화 (로컬)
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 max-w-2xl mx-auto glass-card !p-5 text-xs text-[#7a6e8f] space-y-2">
          <div className="font-bold text-[#38314a] text-sm mb-3">📖 사용 방법</div>
          <div>1. 오른쪽 팔레트에서 원하는 색상을 선택하세요.</div>
          <div>2. 캔버스 위의 원하는 위치를 클릭해서 픽셀을 배치하세요.</div>
          <div>3. 1분의 쿨다운 후 다시 배치할 수 있습니다.</div>
          <div>4. 줌 슬라이더로 캔버스를 확대하여 세밀하게 작업하세요.</div>
          <div className="text-[10px] text-[#9e8fa6] pt-2">
            * 현재 데이터는 브라우저 로컬 저장소에 저장됩니다.
          </div>
        </div>
      </main>
    </div>
  );
}
