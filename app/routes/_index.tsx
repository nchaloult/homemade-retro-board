import type { MetaFunction } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Homemade Retro Board" },
    {
      name: "description",
      content:
        "A homemade, barebones retro board to replace tools which are either paid, or who we have an expiring enterprise license with",
    },
  ];
};

export default function Index() {
  return (
    <main className="h-svh flex flex-col space-y-2 justify-center items-center">
      <div className="grid grid-cols-2 gap-2 p-4 rounded-xl bg-white">
        <Form className="flex flex-col space-y-2">
          <input
            type="text"
            placeholder="Board ID"
            className="p-2 rounded-lg border border-stone-200 bg-stone-100"
          />
          <input
            type="text"
            placeholder="Display name"
            className="p-2 rounded-lg border border-stone-200 bg-stone-100"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-purple-900 text-white hover:bg-purple-800 focus:bg-purple-800 transition"
          >
            Join Board
          </button>
        </Form>
        <Link
          to="boards/new"
          className="flex justify-center items-center px-4 py-2 rounded-lg bg-purple-700 text-white hover:bg-purple-600 focus:bg-purple-600 transition"
        >
          Create New Board
        </Link>
      </div>
      <Link to="boards" className="text-sm text-stone-400 hover:underline">
        Browse previous boards
      </Link>
    </main>
  );
}