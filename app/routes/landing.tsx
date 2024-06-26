import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { displayNameCookie } from "~/displayNameCookie.server";
import { doesBoardExist } from "~/queries.server";

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

export async function action({ request }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errors: any = {};

  const formData = await request.formData();

  const externalId = String(formData.get("externalId"));
  if (externalId === null || externalId === "") {
    errors.externalId = "Board ID must not be empty.";
  }
  const displayName = String(formData.get("displayName"));
  if (displayName === null || displayName === "") {
    errors.displayName = "Display name must not be empty.";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors, displayName });
  }

  if (!(await doesBoardExist(externalId))) {
    errors.externalId = "Board does not exist.";
    return json({ errors, displayName });
  }

  // Store the provided display name in local storage.
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await displayNameCookie.parse(cookieHeader)) || {};
  cookie.displayName = displayName;

  return redirect(`boards/${externalId}`, {
    headers: { "Set-Cookie": await displayNameCookie.serialize(cookie) },
  });
}

export default function Landing() {
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();

  const isSubmitting = navigation.formAction === "/";

  return (
    <main className="h-svh flex flex-col gap-8 justify-center items-center">
      <h1 className="font-bold text-4xl">Homemade Retro Platform</h1>
      <div className="grid grid-cols-2 gap-4">
        <Form method="post" className="flex flex-col gap-2 w-56">
          {actionData?.errors.externalId ? (
            <label htmlFor="externalId" className="ml-1 text-sm text-red-500">
              {actionData.errors.externalId}
            </label>
          ) : null}
          <input
            type="text"
            id="externalId"
            name="externalId"
            placeholder="Board ID"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className="p-2 rounded-lg font-semibold border-2 border-stone-200 outline-none dark:bg-stone-700 dark:border-stone-600 dark:placeholder:text-stone-400 focus:border-stone-400 transition"
          />
          {actionData?.errors.displayName ? (
            <label htmlFor="displayName" className="ml-1 text-sm text-red-500">
              {actionData.errors.displayName}
            </label>
          ) : null}
          <input
            type="text"
            id="displayName"
            name="displayName"
            defaultValue={actionData?.displayName}
            placeholder="Display name"
            className="p-2 rounded-lg font-semibold border-2 border-stone-200 outline-none dark:bg-stone-700 dark:border-stone-600 dark:placeholder:text-stone-400 focus:border-stone-400 transition"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-purple-800 text-white font-semibold border-2 border-purple-950 shadow-[rgb(59_7_100)_0_4px] outline-none dark:bg-purple-600 dark:border-purple-900 dark:shadow-[rgb(88_28_135)_0_4px] hover:bg-purple-700 hover:shadow-[rgb(59_7_100)_0_8px] hover:-translate-y-1 dark:hover:bg-purple-500 dark:hover:shadow-[rgb(88_28_135)_0_8px] focus:bg-purple-700 focus:shadow-[rgb(59_7_100)_0_8px] focus:-translate-y-1 dark:focus:bg-purple-500 dark:focus:shadow-[rgb(88_28_135)_0_8px] active:shadow-[rgb(59_7_100)_0_4px] active:translate-y-0 dark:active:shadow-[rgb(88_28_135)_0_4px] disabled:translate-y-0 disabled:bg-stone-200 disabled:text-stone-900 disabled:border-stone-300 disabled:shadow-[rgb(214_211_209)_0_4px] transition"
          >
            {isSubmitting ? "Joining..." : "Join Board"}
          </button>
        </Form>
        <Link
          to="boards/create"
          className="flex justify-center items-center px-4 py-2 rounded-lg bg-stone-200 font-semibold border-2 border-stone-300 shadow-[rgb(214_211_209)_0_4px] outline-none dark:bg-stone-600 dark:border-stone-700 dark:shadow-[rgb(68_64_60)_0_4px] hover:bg-stone-100 hover:shadow-[rgb(214_211_209)_0_8px] hover:-translate-y-1 dark:hover:bg-stone-500 dark:hover:shadow-[rgb(68_64_60)_0_8px] focus:bg-stone-100 focus:shadow-[rgb(214_211_209)_0_8px] focus:-translate-y-1 dark:focus:bg-stone-500 dark:focus:shadow-[rgb(68_64_60)_0_8px] active:shadow-[rgb(214_211_209)_0_4px] active:translate-y-0 dark:active:shadow-[rgb(68_64_60)_0_4px] transition"
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
