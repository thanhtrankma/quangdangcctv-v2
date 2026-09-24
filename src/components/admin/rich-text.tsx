"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import {
  Bold, Code, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Quote, Redo, Strikethrough, Undo,
} from "lucide-react";
import { uploadFile } from "./fields";

function Btn({ on, active, children, title }: { on: () => void; active?: boolean; children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      className={`grid h-8 w-8 place-items-center rounded ${active ? "bg-teal-100 text-teal-800" : "text-slate-600 hover:bg-slate-100"}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onHtml }: { editor: Editor; onHtml: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 p-1">
      <Btn title="Đậm" on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><Bold size={16} /></Btn>
      <Btn title="Nghiêng" on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><Italic size={16} /></Btn>
      <Btn title="Gạch" on={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}><Strikethrough size={16} /></Btn>
      <Btn title="Tiêu đề H2" on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}><Heading2 size={16} /></Btn>
      <Btn title="Tiêu đề H3" on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}><Heading3 size={16} /></Btn>
      <Btn title="Danh sách" on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}><List size={16} /></Btn>
      <Btn title="Danh sách số" on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}><ListOrdered size={16} /></Btn>
      <Btn title="Trích dẫn" on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}><Quote size={16} /></Btn>
      <Btn
        title="Chèn link"
        active={editor.isActive("link")}
        on={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const href = prompt("Nhập đường dẫn (để trống để bỏ link):", prev ?? "https://");
          if (href === null) return;
          if (!href) editor.chain().focus().unsetLink().run();
          else editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        }}
      >
        <Link2 size={16} />
      </Btn>
      <Btn title="Chèn ảnh" on={() => fileRef.current?.click()}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
      </Btn>
      <Btn title="Hoàn tác" on={() => editor.chain().focus().undo().run()}><Undo size={16} /></Btn>
      <Btn title="Làm lại" on={() => editor.chain().focus().redo().run()}><Redo size={16} /></Btn>
      <span className="mx-1 h-5 w-px bg-slate-300" />
      <Btn title="Sửa HTML" on={onHtml}><Code size={16} /></Btn>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          try {
            const src = await uploadFile(f);
            editor.chain().focus().setImage({ src, alt: f.name.replace(/\.[^.]+$/, "") }).run();
          } catch (x) {
            alert((x as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

// The visual editor drops tags it does not model; content containing these opens in HTML mode instead.
const UNSUPPORTED = /<(figure|figcaption|iframe|video|script|style)\b/i;

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [htmlMode, setHtmlMode] = useState(() => UNSUPPORTED.test(value));
  const risky = UNSUPPORTED.test(value);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), Image, TableKit.configure({ table: { resizable: false } })],
    content: value,
    editorProps: { attributes: { class: "rich-content tiptap px-4 py-3" } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keep the editor in sync when the value is replaced from outside (e.g. HTML mode).
  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  return (
    <div className="overflow-hidden rounded-md border border-slate-300 bg-white">
      {editor && (
        <Toolbar
          editor={editor}
          onHtml={() => {
            if (htmlMode && risky && !confirm("Nội dung có figure/iframe/video. Trình soạn thảo trực quan sẽ làm mất các phần này khi bạn sửa. Vẫn chuyển?")) return;
            setHtmlMode((v) => !v);
          }}
        />
      )}
      {htmlMode && (
        <p className="border-b border-slate-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
          Đang sửa trực tiếp HTML{risky ? " (nội dung có figure/iframe nên giữ nguyên HTML để không mất định dạng)" : ""}. Bấm nút &lt;/&gt; để quay lại chế độ trực quan.
        </p>
      )}
      {htmlMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block min-h-[300px] w-full p-3 font-mono text-xs outline-none"
        />
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}
