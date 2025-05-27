export default function Chip({
  text,
  icon,
  variant,
}: {
  text: string;
  icon?: React.ReactNode;
  variant: "info" | "warning" | "success";
}) {
  return (
    <div
      className={` rounded-full flex items-center justify-center gap-1 py-1 px-2 border-2  ${
        variant === "warning"
          ? "bg-yellow-200/25 border-yellow-200 text-yellow-200"
          : variant === "success" 
          ? "bg-emerald-400/50 border-emerald-400 text-emerald-400"
          : "bg-[#B5E9DA] border-[#C8EFE3] text-white"
      }`}
    >
      <div className={variant === "warning" ? "text-yellow-200" : "text-white"}>
        {icon}
      </div>
      <div className="text-xs ">{text}</div>
    </div>
  );
}
