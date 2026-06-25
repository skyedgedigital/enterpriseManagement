import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { AuthorizedOutlet } from "./AuthorizedOutlet";

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AuthorizedOutlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
