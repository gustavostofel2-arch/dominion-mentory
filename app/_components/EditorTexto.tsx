"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { lerDoc, type No } from "@/lib/doc";
import { markdownParaDoc, temMarkdown } from "@/lib/markdown";

import { CATEGORIAS_EMOJI } from "@/lib/emojis";

/** Postagens antigas em texto simples viram parágrafos para poder editar. */
function inicial(valor: string): No | string {
  const doc = lerDoc(valor);
  if (doc) return doc;
  const blocos = valor
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.replace(/[*#]/g, "").trim())
    .filter(Boolean);
  return {
    type: "doc",
    content: blocos.length
      ? blocos.map((b) => ({ type: "paragraph", content: [{ type: "text", text: b }] }))
      : [{ type: "paragraph" }],
  };
}

function Btn({
  ativo,
  onClick,
  titulo,
  desativado,
  children,
}: {
  ativo?: boolean;
  onClick: () => void;
  titulo: string;
  desativado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={ativo ? "on" : undefined}
      title={titulo}
      aria-label={titulo}
      aria-pressed={ativo}
      disabled={desativado}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function EditorTexto({
  nome = "corpo",
  valor = "",
  aoMudar,
}: {
  nome?: string;
  valor?: string;
  /** Usado nos blocos: avisa o formulário a cada mudança (sem depender do campo escondido). */
  aoMudar?: (json: string) => void;
}) {
  const inicio = useMemo(() => inicial(valor), [valor]);
  const saida = useRef<HTMLInputElement>(null);
  const ref = useRef<Editor | null>(null);
  const aoMudarRef = useRef(aoMudar);
  useEffect(() => {
    aoMudarRef.current = aoMudar;
  }, [aoMudar]);
  const [json, setJson] = useState(() => JSON.stringify(inicio));
  const [emojis, setEmojis] = useState(false);
  const [catEmoji, setCatEmoji] = useState(0);
  const [linkAberto, setLinkAberto] = useState(false);
  const [link, setLink] = useState("");
  const [linkErro, setLinkErro] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } },
      }),
      Placeholder.configure({ placeholder: "Escreva aqui…" }),
    ],
    content: inicio as never,
    editorProps: {
      attributes: { class: "tiptap-area ptexto", "aria-label": "Texto da postagem" },
      // Colar texto com **negrito**, # título ou listas (ex.: vindo de IA): vira formatação de verdade.
      handlePaste: (_view, event) => {
        const html = event.clipboardData?.getData("text/html") ?? "";
        const texto = event.clipboardData?.getData("text/plain") ?? "";
        if (html && /<(p|div|strong|b|h[1-6]|ul|ol|li|br)/i.test(html)) return false;
        if (!texto || !temMarkdown(texto)) return false;
        const doc = markdownParaDoc(texto);
        ref.current?.commands.insertContent(doc.content as never);
        return true;
      },
    },
    onUpdate: ({ editor: e }) => {
      const j = JSON.stringify(e.getJSON());
      setJson(j);
      aoMudarRef.current?.(j);
    },
  });

  useEffect(() => {
    ref.current = editor;
  }, [editor]);

  const st = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            strike: e.isActive("strike"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            ul: e.isActive("bulletList"),
            ol: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            link: e.isActive("link"),
            undo: e.can().undo(),
            redo: e.can().redo(),
          }
        : null,
  });

  // Quando o formulário é enviado, o campo escondido já tem o JSON atual.
  useEffect(() => {
    if (saida.current) saida.current.value = json;
  }, [json]);

  if (!editor) return <div className="editor carregando">Carregando editor…</div>;

  function abrirLink() {
    const atual = editor?.getAttributes("link").href as string | undefined;
    setLink(atual ?? "https://");
    setLinkAberto(true);
    setEmojis(false);
  }
  function aplicarLink() {
    const url = link.trim();
    const c = editor!.chain().focus().extendMarkRange("link");
    if (!url || url === "https://") c.unsetLink().run();
    else if (/^https?:\/\//i.test(url)) c.setLink({ href: url }).run();
    else if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
      setLinkErro("Use um link que comece com https://");
      return;
    } else c.setLink({ href: "https://" + url }).run();
    setLinkErro("");
    setLinkAberto(false);
  }

  return (
    <div className="editor">
      <div className="tb" role="toolbar" aria-label="Formatação do texto">
        <Btn titulo="Negrito (Ctrl+B)" ativo={st?.bold} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></Btn>
        <Btn titulo="Itálico (Ctrl+I)" ativo={st?.italic} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></Btn>
        <Btn titulo="Sublinhado (Ctrl+U)" ativo={st?.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></Btn>
        <Btn titulo="Riscado" ativo={st?.strike} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></Btn>
        <span className="sep" />
        <Btn titulo="Título" ativo={st?.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>Título</Btn>
        <Btn titulo="Subtítulo" ativo={st?.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>Sub</Btn>
        <span className="sep" />
        <Btn titulo="Lista com marcadores" ativo={st?.ul} onClick={() => editor.chain().focus().toggleBulletList().run()}>• Lista</Btn>
        <Btn titulo="Lista numerada" ativo={st?.ol} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. Lista</Btn>
        <Btn titulo="Citação" ativo={st?.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>“ ”</Btn>
        <span className="sep" />
        <Btn titulo="Link" ativo={st?.link} onClick={abrirLink}>Link</Btn>
        <Btn titulo="Emoji" ativo={emojis} onClick={() => { setEmojis((v) => !v); setLinkAberto(false); }}>😀</Btn>
        <span className="sep" />
        <Btn titulo="Desfazer (Ctrl+Z)" desativado={!st?.undo} onClick={() => editor.chain().focus().undo().run()}>↶</Btn>
        <Btn titulo="Refazer (Ctrl+Y)" desativado={!st?.redo} onClick={() => editor.chain().focus().redo().run()}>↷</Btn>
        <Btn titulo="Limpar formatação" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>Tx</Btn>
      </div>

      {linkAberto && (
        <div className="pop-link">
          <input
            type="text"
            inputMode="url"
            value={link}
            autoFocus
            placeholder="https://…"
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                aplicarLink();
              } else if (e.key === "Escape") setLinkAberto(false);
            }}
          />
          <button type="button" className="btn primary mini" onClick={aplicarLink}>Aplicar</button>
          <button type="button" className="btn mini" onClick={() => setLinkAberto(false)}>Cancelar</button>
          {linkErro && <span className="erro-in">{linkErro}</span>}
        </div>
      )}

      {emojis && (
        <div className="emo-painel" aria-label="Emojis">
          <div className="emo-abas">
            {CATEGORIAS_EMOJI.map((c, i) => (
              <button type="button" key={c.nome} className={i === catEmoji ? "on" : ""} title={c.nome} onMouseDown={(ev) => ev.preventDefault()} onClick={() => setCatEmoji(i)}>{c.icone}</button>
            ))}
          </div>
          <div className="emo-grade">
            {CATEGORIAS_EMOJI[catEmoji].lista.map((e) => (
              <button type="button" key={e} onMouseDown={(ev) => ev.preventDefault()} onClick={() => editor.chain().focus().insertContent(e).run()}>{e}</button>
            ))}
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
      <input ref={saida} type="hidden" name={nome} defaultValue={json} />
    </div>
  );
}
