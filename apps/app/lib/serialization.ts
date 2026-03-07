import type { User } from "@repo/backend/auth";

export type MemberInfo = Pick<
  User,
  "id" | "name" | "email" | "image" | "organizationRole"
>;

const toMemberInfo = (member: User): MemberInfo => ({
  id: member.id,
  name: member.name,
  email: member.email,
  image: member.image,
  organizationRole: member.organizationRole,
});

export const toMemberInfoList = (members: User[]): MemberInfo[] =>
  members.map(toMemberInfo);
