import { getProfileContext } from "@/lib/supabase/profile";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const { self } = await getProfileContext();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-xl text-chocolate mb-4">Your profile</h1>
      <ProfileForm profile={self} />
    </div>
  );
}
