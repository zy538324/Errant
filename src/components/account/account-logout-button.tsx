"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccountLogoutButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await fetch("/api/account/logout", { method: "POST" }).catch(() => null);
        router.push("/shop");
        router.refresh();
      }}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign out
    </Button>
  );
}

