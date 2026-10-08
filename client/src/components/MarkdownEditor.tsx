import { useRef, useState } from "react";
import { Bold, Code2, Heading1, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Quote } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onUploadImage: (file: File) => Promise<string>;
};

export default function MarkdownEditor({ value, onChange, onUploadImage }: Props) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const insertAroundSelection = (before: string, after = before, fallback = "텍스트") => {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      editor.focus();
      const cursor = start + before.length + selected.length + after.length;
      editor.setSelectionRange(cursor, cursor);
    });
  };

  const insertLinePrefix = (prefix: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`;
    onChange(next);
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  };

  const chooseImage = async (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      insertAroundSelection(`![${file.name.replace(/\.[^/.]+$/, "")}](`, ")", url);
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  return (
    <div className="markdown-editor">
      <div className="markdown-toolbar" aria-label="본문 서식 도구">
        <button type="button" className="toolbar-button" title="굵게" onClick={() => insertAroundSelection("**")}><Bold size={15} /></button>
        <button type="button" className="toolbar-button" title="기울임" onClick={() => insertAroundSelection("*")}><Italic size={15} /></button>
        <button type="button" className="toolbar-button" title="제목 H1" onClick={() => insertLinePrefix("# ")}><Heading1 size={15} /></button>
        <button type="button" className="toolbar-button" title="소제목 H2" onClick={() => insertLinePrefix("## ")}><Heading2 size={15} /></button>
        <button type="button" className="toolbar-button" title="인용" onClick={() => insertLinePrefix("> ")}><Quote size={15} /></button>
        <button type="button" className="toolbar-button" title="목록" onClick={() => insertLinePrefix("- ")}><List size={15} /></button>
        <button type="button" className="toolbar-button" title="번호 목록" onClick={() => insertLinePrefix("1. ")}><ListOrdered size={15} /></button>
        <button type="button" className="toolbar-button" title="코드" onClick={() => insertAroundSelection("`")}><Code2 size={15} /></button>
        <button type="button" className="toolbar-button" title="링크" onClick={() => insertAroundSelection("[", "](https://)", "링크 텍스트")}><Link2 size={15} /></button>
        <button type="button" className="toolbar-button" title="이미지 업로드" onClick={() => imageInputRef.current?.click()} disabled={uploading}><ImagePlus size={15} /></button>
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void chooseImage(file); }} />
        <span className="toolbar-status">{uploading ? "이미지 업로드 중..." : "Markdown 서식 지원"}</span>
      </div>
      <textarea ref={editorRef} className="form-textarea editor-area" id="post-content" value={value} onChange={(event) => onChange(event.target.value)} required maxLength={50000} placeholder="툴바로 서식을 넣거나 Markdown으로 본문을 작성하세요." />
    </div>
  );
}
