export default function LoadingSalas() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-4">
      <div className="h-6 w-28 rounded-full bg-amber-50 animate-pulse" />
      <div className="h-8 w-56 rounded bg-gray-100 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-44 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
