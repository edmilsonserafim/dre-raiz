"use client";

export interface TableBlockProps {
  title?: string;
  ds: any;
}

/**
 * TableBlock - Renderiza tabelas de dados
 *
 * Versão simplificada que renderiza qualquer dataset com columns e rows.
 */
export function TableBlock({ title, ds }: TableBlockProps) {
  if (!ds) return null;

  return (
    <div className="rounded-2xl border bg-white p-4">
      {title && <div className="mb-2 font-semibold">{title}</div>}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              {ds.columns.map((c: string, i: number) => (
                <th key={i} className="border-b p-2">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ds.rows.map((r: any[], i: number) => (
              <tr key={i} className="border-b">
                {r.map((cell, j) => <td key={j} className="p-2">{String(cell)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
