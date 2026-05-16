import TabletTopBar from "@/components/layout/TabletTopBar";

export default function TabletLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d1b2e]">
      <TabletTopBar />
      <main className="flex-1 pt-14">
        {children}
      </main>
    </div>
  );
}
