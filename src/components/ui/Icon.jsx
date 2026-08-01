import { cn } from "@/lib/utils"

export default function Icon({ name, size = 20, className, style, ariaLabel, ...props }) {
  return (
    <span
      className={cn("msr", className)}
      style={{ fontSize: size, ...style }}
      aria-hidden={ariaLabel ? undefined : "true"}
      aria-label={ariaLabel}
      {...props}
    >
      {name}
    </span>
  )
}
