import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — OpenChat",
  description: "Configure your AI provider, model, API key, and system prompt.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
