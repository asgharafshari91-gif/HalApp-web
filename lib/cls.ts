export function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}