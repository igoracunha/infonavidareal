import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
function special(name: string, attrs: string[], label: string) {
  return Node.create({
    name,
    group: "block",
    atom: true,
    draggable: true,
    addAttributes() {
      return Object.fromEntries(attrs.map((key) => [key, { default: "" }]));
    },
    parseHTML() {
      return [{ tag: `aside[data-block="${name}"]` }];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        "aside",
        mergeAttributes(HTMLAttributes, {
          "data-block": name,
          class: "editor-special",
        }),
        ["strong", {}, label],
        ["p", {}, HTMLAttributes.title || ""],
        [
          "pre",
          {},
          HTMLAttributes.text ||
            HTMLAttributes.steps ||
            "Edite este bloco no painel de propriedades.",
        ],
      ];
    },
  });
}
export const extensions = [
  StarterKit.configure({ codeBlock: false, link: { openOnClick: false } }),
  Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        caption: { default: "" },
        align: { default: "center" },
        width: { default: 960 },
        height: { default: 540 },
        original_url: { default: "" },
        file_id: { default: "" },
      };
    },
  }),
  TableKit.configure({ table: { resizable: true } }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  Superscript,
  Subscript,
  TaskList,
  TaskItem.configure({ nested: true }),
  CodeBlockLowlight.configure({ lowlight: createLowlight(common) }),
  special(
    "promptBlock",
    ["title", "description", "text", "instructions", "example"],
    "✦ Prompt pronto",
  ),
  special("noticeBlock", ["title", "text", "variant"], "ⓘ Aviso"),
  special("tutorialBlock", ["title", "steps"], "① Tutorial"),
];
