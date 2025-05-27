export default function SquabbleButton({
  text,
  variant,
  disabled,
}: {
  text: string;
  variant: "primary" | "secondary";
  disabled: boolean;
}) {
  return (
    <button
      disabled={disabled}
      className={`w-full font-bold text-3xl border-none rounded-xl px-12 py-4 bg-white text-[#00BFFF] hover:bg-gray-50 active:bg-gray-100 ${
        disabled ? " opacity-50" : ""
      }`}
    >
      {text}
    </button>
  );
}
