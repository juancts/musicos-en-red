import { Suspense } from "react";
import MensajesInbox from "@/components/mensajes/MensajesInbox";

export default function MensajesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="h-8 w-40 rounded-lg bg-gray-100 dark:bg-gray-800 mb-6" />
          <div className="h-96 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50" />
        </div>
      }
    >
      <MensajesInbox />
    </Suspense>
  );
}
