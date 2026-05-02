export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {children}
    </div>
  );
}
