"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/design-system/components/ui/collapsible";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@repo/design-system/components/ui/sidebar";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import type * as navigation from "@/lib/navigation";
import { SidebarRouteLink } from "./sidebar-route-link";

export const SidebarItem = ({
  active,
  href,
  icon: Icon,
  items,
  label,
}: navigation.SidebarPage) => {
  const pathname = usePathname();
  const isActive = active(pathname);
  const hasItems = Boolean(items?.length);

  return (
    <Collapsible asChild defaultOpen={isActive}>
      <SidebarMenuItem>
        {hasItems ? (
          <CollapsibleTrigger asChild>
            <SidebarMenuButton isActive={isActive}>
              <Icon className="opacity-70" />
              <span>{label}</span>
            </SidebarMenuButton>
          </CollapsibleTrigger>
        ) : (
          <SidebarMenuButton asChild isActive={isActive}>
            <SidebarRouteLink href={href}>
              <Icon className="opacity-70" />
              <span>{label}</span>
            </SidebarRouteLink>
          </SidebarMenuButton>
        )}
        {hasItems ? (
          <>
            <CollapsibleTrigger asChild>
              <SidebarMenuAction className="data-[state=open]:rotate-90">
                <ChevronRight className="opacity-70" size={16} />
                <span className="sr-only">Toggle</span>
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.label}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={subItem.active(pathname)}
                    >
                      <SidebarRouteLink href={subItem.href}>
                        <span>{subItem.label}</span>
                      </SidebarRouteLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </>
        ) : null}
      </SidebarMenuItem>
    </Collapsible>
  );
};
