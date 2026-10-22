import type { ButtonHTMLAttributes, ReactNode } from "react";
import { House } from "lucide-react";

export function Button({
  variant = "outline",
  className = "",
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`button button-${variant} ${className}`}
      {...props}
    />
  );
}
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`brand-mark ${small ? "brand-mark-small" : ""}`}
      aria-hidden="true"
    >
      <House size={small ? 18 : 24} strokeWidth={1.6} />
    </span>
  );
}
export function EmptyState({
  icon,
  title,
  children,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`empty-state ${compact ? "empty-compact" : ""}`}>
      <span className="empty-icon" aria-hidden="true">
        {icon}
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
