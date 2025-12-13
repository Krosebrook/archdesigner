import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function FilterDropdown({ 
  label = "Filter", 
  value, 
  onValueChange, 
  options = [],
  placeholder = "All"
}) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-gray-500" />
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px] bg-white border-gray-200">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}