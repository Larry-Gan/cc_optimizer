import type { PropsWithChildren } from "react";

export function PageContainer({ children }: PropsWithChildren) {
  return <main className="mx-auto max-w-7xl px-6 py-6 text-slate-100">{children}</main>;
}
