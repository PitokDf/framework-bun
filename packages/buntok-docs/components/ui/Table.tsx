import { type ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className="my-4 overflow-x-auto">
      <table
        className={`w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden ${className}`}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-bg-tertiary border-b border-border-primary">
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={`border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  header = false,
  className = "",
}: {
  children: ReactNode;
  header?: boolean;
  className?: string;
}) {
  const Tag = header ? "th" : "td";
  return (
    <Tag
      className={`px-4 py-2 text-left ${header ? "font-semibold text-text-primary" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
