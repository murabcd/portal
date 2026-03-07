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
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as navigation from "@/lib/navigation";

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
        <SidebarMenuButton asChild={!hasItems} isActive={isActive}>
          {hasItems ? (
            <>
              <Icon className="opacity-70" />
              <span>{label}</span>
            </>
          ) : (
            <Link href={href}>
              <Icon className="opacity-70" />
              <span>{label}</span>
            </Link>
          )}
        </SidebarMenuButton>
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
                      <Link href={subItem.href}>
                        <span>{subItem.label}</span>
                      </Link>
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
