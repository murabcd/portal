import type { auth } from "./auth";

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];

export const PortalRole = {
  Admin: "admin",
  Editor: "editor",
  Member: "member",
} as const;

export type PortalRole = (typeof PortalRole)[keyof typeof PortalRole];
