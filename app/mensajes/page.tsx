import { Suspense } from "react";
import MensajesInbox from "@/components/mensajes/MensajesInbox";

export default function MensajesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="h-8 w-40 rounded-lg bg-gray-100 mb-6" />
          <div className="h-96 rounded-2xl border border-gray-100 bg-gray-50/50" />
        </div>
      }
    >
      <MensajesInbox />
    </Suspense>
  );
}
