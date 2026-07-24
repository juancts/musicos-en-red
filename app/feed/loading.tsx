export default function LoadingFeed() {
  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-4">
      <div className="h-6 w-24 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
      <div className="h-8 w-40 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      <div className="h-4 w-72 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-28 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
