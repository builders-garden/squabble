"use client";
export default function SquabbleButton({
  text,
  variant,
  disabled,
  onClick,
}: {
  text: string;
  variant: "primary" | "secondary" | "outline";
  disabled: boolean;
  onClick: () => void;
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-white text-[#1B7A6E] hover:bg-gray-50 active:bg-gray-100";
      case "secondary":
        return "bg-[#1B7A6E] text-white hover:bg-[#166B60] active:bg-[#145C52]";
      case "outline":
        return "bg-transparent border-2 border-white text-white hover:bg-[#1B7A6E]/10 active:bg-[#1B7A6E]/20";
      default:
        return "bg-white text-[#1B7A6E] hover:bg-gray-50 active:bg-gray-100";
    }
  };

  return (
    <button
      disabled={disabled}
      className={`w-full font-bold text-3xl rounded-xl px-12 py-4 ${getVariantStyles()} ${
        disabled ? "opacity-50" : ""
      }`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
