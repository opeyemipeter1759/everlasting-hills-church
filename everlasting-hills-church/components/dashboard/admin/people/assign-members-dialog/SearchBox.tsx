import { Search } from "lucide-react";
import { fieldCls } from "../PeopleModal";

export default function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        className={`${fieldCls} pl-10`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
