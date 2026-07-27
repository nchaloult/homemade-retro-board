import { createCookie } from "react-router";

export const displayNameCookie = createCookie("displayName");

export async function getDisplayName(
  request: Request
): Promise<string | undefined> {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await displayNameCookie.parse(cookieHeader)) || {};
  return cookie.displayName || undefined;
}
