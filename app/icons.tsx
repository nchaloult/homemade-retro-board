export function UpArrowIcon() {
  return (
    <svg
      className="w-[12px] h-[16px]"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="20"
      fill="none"
      viewBox="0 0 18 20"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        d="M9 2v16m0-16 6 6m-6-6-6 6"
      />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg
      className="w-[16px] h-[16px]"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        d="M5 12h14m-7 7V5"
      />
    </svg>
  );
}

export function SortIcon() {
  return (
    <svg
      className="w-[16px] h-[16px]"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        d="M8 20V10m0 10-3-3m3 3 3-3m5-13v10m0-10 3 3m-3-3-3 3"
      />
    </svg>
  );
}

export interface ClipboardIconProps {
  isCopied: boolean;
}
export function ClipboardIcon({ isCopied }: ClipboardIconProps) {
  const clipboard =
    "M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-5-4v4h4V3h-4Z";
  const clipboardWithCheck =
    "M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z";

  return (
    <svg
      className="w-[16px] h-[16px]"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        d={isCopied ? clipboardWithCheck : clipboard}
      />
    </svg>
  );
}
