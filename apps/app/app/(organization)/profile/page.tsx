import { currentUser } from "@repo/backend/auth/utils";
import { createMetadata } from "@repo/lib/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModeToggle } from "./components/mode-toggle";
import { ProfileForm } from "./components/profile-form";
import { ProfilePhoto } from "./components/profile-photo";

export const metadata: Metadata = createMetadata({
  title: "Profile",
  description: "Manage your account info.",
});

const Profile = async () => {
  const user = await currentUser();

  if (!user) {
    notFound();
  }

  return (
    <div className="p-16">
      <div className="mx-auto grid w-full max-w-2xl divide-y rounded-lg border bg-background shadow-sm">
        <div className="grid grid-cols-3 gap-8 p-8">
          <div>
            <ProfilePhoto avatarUrl={user.image ?? ""} userId={user.id} />
            {user.image ? (
              <p className="mt-1 text-center text-muted-foreground text-xs">
                Click or drag-and-drop to change
              </p>
            ) : null}
          </div>
          <div className="col-span-2">
            <ProfileForm
              defaultEmail={user.email ?? ""}
              defaultName={user.name ?? ""}
            />
          </div>
        </div>
        <div className="p-8">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
};

export default Profile;
