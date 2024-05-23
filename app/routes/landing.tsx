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
    <main className="h-svh flex flex-col space-y-8 justify-center items-center">
      <h1 className="font-bold text-4xl">Homemade Retro Platform</h1>
      <div className="grid grid-cols-2 gap-4">
        <Form className="flex flex-col space-y-2">
          <input
            type="text"
            placeholder="Board ID"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className="p-2 rounded-lg font-semibold border-2 border-stone-200 outline-none focus:border-stone-400 transition"
          />
          <input
            type="text"
            placeholder="Display name"
            className="p-2 rounded-lg font-semibold border-2 border-stone-200 outline-none focus:border-stone-400 transition"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-purple-800 text-white font-semibold border-2 border-purple-950 shadow-[rgb(59_7_100)_0_4px] outline-none hover:bg-purple-700 hover:shadow-[rgb(59_7_100)_0_8px] hover:-translate-y-1 focus:bg-purple-700 focus:shadow-[rgb(59_7_100)_0_8px] focus:-translate-y-1 active:shadow-[rgb(59_7_100)_0_4px] active:translate-y-0 transition-all"
          >
            Join Board
          </button>
        </Form>
        <Link
          to="boards/create"
          className="flex justify-center items-center px-4 py-2 rounded-lg bg-stone-200 text-stone-900 font-semibold border-2 border-stone-300 shadow-[rgb(214_211_209)_0_4px] outline-none hover:bg-stone-100 hover:shadow-[rgb(214_211_209)_0_8px] hover:-translate-y-1 focus:bg-stone-100 focus:shadow-[rgb(214_211_209)_0_8px] focus:-translate-y-1 active:shadow-[rgb(214_211_209)_0_4px] active:translate-y-0 transition-all"
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
