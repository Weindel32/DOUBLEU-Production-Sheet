import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen print:block print:h-auto print:min-h-0">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-auto print:block print:overflow-visible print:w-full print:flex-none print:h-auto">{children}</main>
    </div>
  );
}
