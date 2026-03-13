export function PageSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary">
      <div className="animate-fade-in">
        <img
          src="/akuris-favicon.png"
          alt="Akuris"
          className="h-14 w-14 brightness-0 invert animate-[spin_2s_linear_infinite]"
        />
      </div>
    </div>
  );
}
