import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from "react-router";
import type { Route } from "./+types/landing";
import { displayNameCookie } from "~/displayNameCookie.server";
import { doesBoardExist } from "~/queries.server";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Homemade Retro Board" },
    {
      name: "description",
      content:
        "A homemade, barebones retro board to replace tools which are either paid, or who we have an expiring enterprise license with",
    },
  ];
};

export async function action({ request }: Route.ActionArgs) {
  // oxlint-disable-next-line no-explicit-any
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
    return { errors, displayName };
  }

  if (!(await doesBoardExist(externalId))) {
    errors.externalId = "Board does not exist.";
    return { errors, displayName };
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
            // oxlint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className="p-2 rounded-lg bg-white font-semibold border-2 border-stone-200 outline-none dark:bg-stone-700 dark:border-stone-600 dark:placeholder:text-stone-400 focus:border-stone-400 transition"
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
            className="p-2 rounded-lg bg-white font-semibold border-2 border-stone-200 outline-none dark:bg-stone-700 dark:border-stone-600 dark:placeholder:text-stone-400 focus:border-stone-400 transition"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-purple-800 text-white font-semibold border-2 border-purple-950 shadow-[0_4px_rgb(59_7_100)] outline-none cursor-pointer dark:bg-purple-600 dark:border-purple-900 dark:shadow-[0_4px_rgb(88_28_135)] hover:bg-purple-700 hover:shadow-[0_8px_rgb(59_7_100)] hover:-translate-y-1 dark:hover:bg-purple-500 dark:hover:shadow-[0_8px_rgb(88_28_135)] focus:bg-purple-700 focus:shadow-[0_8px_rgb(59_7_100)] focus:-translate-y-1 dark:focus:bg-purple-500 dark:focus:shadow-[0_8px_rgb(88_28_135)] active:shadow-[0_4px_rgb(59_7_100)] active:translate-y-0 dark:active:shadow-[0_4px_rgb(88_28_135)] disabled:translate-y-0 disabled:cursor-default disabled:bg-stone-200 disabled:text-stone-900 disabled:border-stone-300 disabled:shadow-[0_4px_rgb(214_211_209)] transition"
          >
            {isSubmitting ? "Joining..." : "Join Board"}
          </button>
        </Form>
        <Link
          to="boards/create"
          className="flex justify-center items-center px-4 py-2 rounded-lg bg-stone-200 font-semibold border-2 border-stone-300 shadow-[0_4px_rgb(214_211_209)] outline-none cursor-pointer dark:bg-stone-600 dark:border-stone-700 dark:shadow-[0_4px_rgb(68_64_60)] hover:bg-stone-100 hover:shadow-[0_8px_rgb(214_211_209)] hover:-translate-y-1 dark:hover:bg-stone-500 dark:hover:shadow-[0_8px_rgb(68_64_60)] focus:bg-stone-100 focus:shadow-[0_8px_rgb(214_211_209)] focus:-translate-y-1 dark:focus:bg-stone-500 dark:focus:shadow-[0_8px_rgb(68_64_60)] active:shadow-[0_4px_rgb(214_211_209)] active:translate-y-0 dark:active:shadow-[0_4px_rgb(68_64_60)] transition"
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
