export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen max-w-md mx-auto" style={{ backgroundColor: "#0d1b2e", color: "#e8edf4" }}>
      {children}
    </div>
  );
}
