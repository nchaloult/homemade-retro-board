import { Link, Outlet } from "@remix-run/react";

export default function Layout() {
  return (
    <>
      <div className="px-8">
        <nav className="flex justify-between p-4 border-b-2 border-stone-200">
          <Link
            to="/"
            className="text-sm text-stone-400 font-bold hover:underline"
          >
            Homemade Retro Board
          </Link>
          <span className="text-sm text-stone-400 font-bold">
            Display name goes here
          </span>
        </nav>
      </div>
      <Outlet />
    </>
  );
}
