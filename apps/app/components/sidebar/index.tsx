"use client";

import { FlowniRole } from "@repo/backend/auth";
import { signOut } from "@repo/backend/auth/client";
import { getUserName } from "@repo/backend/auth/format";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/design-system/components/ui/sidebar";
import { handleError } from "@repo/design-system/lib/handle-error";
import { cn } from "@repo/design-system/lib/utils";
import { ChevronsUpDown, LogOut, UserCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  activity,
  changelog,
  data,
  features,
  feedback,
  home,
  initiatives,
  insights,
  releases,
  roadmap,
  settings,
} from "../../lib/navigation";
import { SidebarItem } from "./sidebar-item";

type SidebarUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly image?: string;
  readonly organizationRole: FlowniRole;
};

type SidebarOrganization = {
  readonly name: string;
  readonly slug: string;
  readonly logoUrl: string | null;
};

type SidebarProps = {
  readonly user: SidebarUser;
  readonly organization: SidebarOrganization;
};

export const Sidebar = ({ user, organization }: SidebarProps) => {
  const router = useRouter();
  const sidebar = useSidebar();

  const handleSignOut = async () => {
    try {
      await signOut();

      router.push("/sign-in");
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <SidebarComponent collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem
            className={cn(
              "flex items-center gap-2",
              sidebar.open ? "px-2" : null
            )}
          >
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-sidebar-primary">
              {organization.logoUrl ? (
                <Image
                  alt=""
                  className="object-cover"
                  height={32}
                  src={organization.logoUrl}
                  width={32}
                />
              ) : null}
            </div>
            <div
              className={cn(
                "flex flex-col leading-none",
                sidebar.open ? null : "hidden"
              )}
            >
              <span className="truncate font-medium text-sm">
                {organization.name}
              </span>
              <span className="truncate text-muted-foreground text-xs">
                @{organization.slug}
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="sr-only text-muted-foreground">
            General
          </SidebarGroupLabel>
          <SidebarMenu>
            {[home, activity, insights].map((item) => (
              <SidebarItem key={item.label} {...item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            Plan
          </SidebarGroupLabel>
          <SidebarMenu>
            {[feedback, initiatives, features].map((item) => (
              <SidebarItem key={item.label} {...item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            Ship
          </SidebarGroupLabel>
          <SidebarMenu>
            {[roadmap, releases, changelog].map((item) => (
              <SidebarItem key={item.label} {...item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
        {user.organizationRole !== FlowniRole.Member ? (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarItem {...data} />
                {user.organizationRole === FlowniRole.Admin ? (
                  <SidebarItem {...settings} />
                ) : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  size="lg"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage
                      alt={getUserName(user)}
                      src={user.image ?? ""}
                    />
                    <AvatarFallback className="rounded-lg">
                      {getUserName(user).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {getUserName(user)}
                    </span>
                    <span className="truncate text-muted-foreground text-xs">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={sidebar.isMobile ? "bottom" : "top"}
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage
                        alt={getUserName(user)}
                        src={user.image ?? ""}
                      />
                      <AvatarFallback className="rounded-lg">
                        {getUserName(user).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {getUserName(user)}
                      </span>
                      <span className="truncate text-muted-foreground text-xs">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <UserCircleIcon
                      className="text-muted-foreground"
                      size={16}
                    />
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onSelect={(event) => {
                    event.preventDefault();
                    handleSignOut();
                  }}
                >
                  <LogOut className="text-muted-foreground" size={16} />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarComponent>
  );
};
