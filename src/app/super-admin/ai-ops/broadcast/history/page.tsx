import BroadcastHistoryClient from "./history-client";

export const metadata = {
  title: "Dispatch History | AI Ops",
  description: "View history and performance of platform-wide broadcasts."
};

export default function BroadcastHistoryPage() {
  return <BroadcastHistoryClient />;
}
