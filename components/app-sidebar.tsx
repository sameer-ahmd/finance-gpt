"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { PlusIcon } from "@/components/icons";
import { SidebarHistory } from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between">
              <Link
                className="flex flex-row items-center gap-3"
                href="/"
                onClick={() => {
                  setOpenMobile(false);
                }}
              >
                <Image
                  src="/images/finsight-banner.svg"
                  alt="FinSight"
                  width={120}
                  height={40}
                  className="cursor-pointer"
                />
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-8 p-1 md:h-fit md:p-2"
                    onClick={() => {
                      setOpenMobile(false);
                      router.push("/");
                      router.refresh();
                    }}
                    type="button"
                    variant="ghost"
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end" className="hidden md:block">
                  New Chat
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
