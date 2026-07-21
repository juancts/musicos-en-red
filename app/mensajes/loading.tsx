export default function LoadingMensajes() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <div className="h-6 w-28 rounded-full bg-gray-100 animate-pulse" />
      <div className="h-8 w-48 rounded bg-gray-100 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-4">
        <div className="h-[420px] rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
        <div className="h-[420px] rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
      </div>
    </div>
  );
}
