import { Suspense } from "react";
import { getProfileContext } from "@/lib/supabase/profile";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { NavLinks } from "@/components/NavLinks";
import { SignOutButton } from "@/components/SignOutButton";
import { InstallPwaPrompt } from "@/components/InstallPwaPrompt";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { self, household } = await getProfileContext();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <RegisterServiceWorker />
      <header className="flex flex-col gap-3 border-b border-camel/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg text-chocolate">Keto Kitchen</h1>
          <div className="sm:hidden">
            <SignOutButton />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Suspense fallback={null}>
            <ProfileSwitcher household={household} selfId={self.id} />
          </Suspense>
          <div className="hidden sm:block">
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="sm:order-first">
        <NavLinks />
      </div>
      <main className="flex-1 px-4 py-5 sm:px-6">{children}</main>
      <InstallPwaPrompt />
    </div>
  );
}
