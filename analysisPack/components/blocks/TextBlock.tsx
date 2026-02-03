"use client";

export interface TextBlockProps {
  block: any;
}

/**
 * TextBlock - Renderiza blocos de texto e callouts
 *
 * Versão simplificada que renderiza ambos text e callout de forma similar.
 * Para diferenciar visualmente callouts, descomente as linhas do intentStyles.
 */
export function TextBlock({ block }: TextBlockProps) {
  const isCallout = block.type === "callout";

  // Descomente para diferenciar visualmente callouts:
  // const intentStyles = {
  //   positive: "bg-green-50 border-green-200",
  //   negative: "bg-red-50 border-red-200",
  //   neutral: "bg-blue-50 border-blue-200"
  // };
  // const bgClass = isCallout ? intentStyles[block.intent] : "bg-white";

  return (
    <div className={`rounded-2xl border p-4 ${isCallout ? "bg-white" : "bg-white"}`}>
      {block.title && <div className="mb-2 font-semibold">{block.title}</div>}
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {block.bullets.map((t: string, i: number) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
