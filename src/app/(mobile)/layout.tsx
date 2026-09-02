export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 max-w-md min-[768px]:max-w-2xl mx-auto">
      {children}
    </div>
  );
}
