// app/settings/page.tsx
import SettingsClient from "./ui/settings-client";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return <SettingsClient />;
}