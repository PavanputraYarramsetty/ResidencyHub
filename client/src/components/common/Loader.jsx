export default function Loader({ type = 'card', count = 3 }) {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl p-6 bg-white shadow-sm">
            <div className="skeleton h-4 w-3/4 mb-4" />
            <div className="skeleton h-3 w-1/2 mb-2" />
            <div className="skeleton h-3 w-full mb-2" />
            <div className="skeleton h-8 w-1/3 mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="rounded-2xl bg-white shadow-sm p-6">
        <div className="skeleton h-4 w-1/4 mb-6" />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 mb-3">
            <div className="skeleton h-3 w-1/5" />
            <div className="skeleton h-3 w-1/4" />
            <div className="skeleton h-3 w-1/6" />
            <div className="skeleton h-3 w-1/5" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'room') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl p-4 bg-white shadow-sm">
            <div className="skeleton h-8 w-16 mb-2 mx-auto" />
            <div className="skeleton h-3 w-20 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  // Spinner fallback
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
}
