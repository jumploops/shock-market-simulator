import { ReactNode, useState } from "react";

interface TooltipProps {
  label: ReactNode;
  content: ReactNode;
}

export const Tooltip = ({ label, content }: TooltipProps) => {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="tooltip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {label}
      {open && <span className="tooltip-content">{content}</span>}
    </span>
  );
};

export default Tooltip;
