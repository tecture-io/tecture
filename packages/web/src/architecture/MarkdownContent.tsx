import {
  isValidElement,
  type AnchorHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import Markdown from "markdown-to-jsx";
import { MermaidBlock } from "./MermaidBlock";

interface Props {
  source: string;
}

export function MarkdownContent({ source }: Props) {
  return (
    <div className="prose-markdown">
      <Markdown
        options={{
          forceBlock: true,
          overrides: {
            pre: { component: PreOverride },
            a: { component: LinkOverride },
          },
        }}
      >
        {source}
      </Markdown>
    </div>
  );
}

function LinkOverride({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isInternal =
    !href ||
    href.startsWith("#") ||
    href.startsWith("/") ||
    (typeof window !== "undefined" && href.startsWith(window.location.origin));
  return (
    <a
      href={href}
      {...rest}
      {...(isInternal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
    >
      {children}
    </a>
  );
}

function PreOverride({ children }: { children?: ReactNode }) {
  const mermaidSource = extractMermaidSource(children);
  if (mermaidSource !== null) {
    return <MermaidBlock chart={mermaidSource} />;
  }
  return <pre>{children}</pre>;
}

function extractMermaidSource(node: ReactNode): string | null {
  const only = Array.isArray(node) && node.length === 1 ? node[0] : node;
  if (!isValidElement(only)) return null;
  const el = only as ReactElement<{ className?: string; children?: ReactNode }>;
  if (el.type !== "code") return null;
  const cn = el.props.className ?? "";
  const isMermaid =
    cn === "lang-mermaid" ||
    cn === "language-mermaid" ||
    cn.split(/\s+/).includes("lang-mermaid") ||
    cn.split(/\s+/).includes("language-mermaid");
  if (!isMermaid) return null;
  const inner = el.props.children;
  if (typeof inner === "string") return inner;
  if (Array.isArray(inner)) return inner.map((c) => String(c ?? "")).join("");
  return String(inner ?? "");
}
