// app/404/page.tsx
import { Suspense } from "react";
import NotFoundClient from "./ui/not-found-client";

export const dynamic = "force-dynamic";

export default function NotFoundPage() {
  return (
    <Suspense fallback={null}>
      <NotFoundClient />
    </Suspense>
  );
}