import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { getDisplayName } from "~/displayNameCookie.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const displayName = await getDisplayName(request);
  return json({ displayName });
}

export default function Layout() {
  const { displayName } = useLoaderData<typeof loader>();

  return (
    <>
      <div className="px-8">
        <nav className="flex justify-between p-4 text-stone-400 border-b-2 border-stone-200 dark:border-stone-700">
          <Link to="/" className="text-sm font-bold hover:underline">
            Homemade Retro Board
          </Link>
          <span className="text-sm font-bold">
            {displayName || "Display name not set."}
          </span>
        </nav>
      </div>
      <Outlet />
    </>
  );
}
