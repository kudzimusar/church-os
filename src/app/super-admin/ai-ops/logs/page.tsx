import AILogsView from "./ai-logs-view";

export const metadata = {
  title: "AI Interaction Logs | Church OS Admin",
  description: "Detailed turn-by-turn audit logs of AI conversations."
};

export default function AILogsPage() {
  return <AILogsView />;
}
