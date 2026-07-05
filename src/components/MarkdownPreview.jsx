import React from "react";

function renderInlineMarkdown(text) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export default function MarkdownPreview({ markdown }) {
  const lines = markdown.split("\n");
  const blocks = [];
  let codeLines = [];
  let listItems = [];
  let inCodeBlock = false;
  let codeLanguage = "";

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(
        <ul key={`list-${blocks.length}`}>
          {listItems.map((item, index) => (
            <li key={index}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line) => {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        blocks.push(
          <pre key={`code-${blocks.length}`}>
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        codeLanguage = "";
        inCodeBlock = false;
      } else {
        flushList();
        codeLanguage = line.replace("```", "").trim();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      listItems.push(line.replace(/^\s*[-*]\s+/, ""));
      return;
    }

    flushList();

    if (line.trim() === "") {
      blocks.push(<br key={`break-${blocks.length}`} />);
      return;
    }

    blocks.push(
      <p key={`p-${blocks.length}`}>{renderInlineMarkdown(line)}</p>
    );
  });

  flushList();

  if (inCodeBlock) {
    blocks.push(
      <pre key={`code-${blocks.length}`}>
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  return (
    <div className="markdown-preview" data-code-language={codeLanguage}>
      {blocks}
    </div>
  );
}
