"use client";

import { Button } from "~/components/ui/button";
import { LayoutGrid, Table } from "lucide-react";

export type ViewType = "masonry" | "table";

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex rounded-full border-2 border-gray-200 bg-white p-1">
      <Button
        variant={currentView === "masonry" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("masonry")}
        className={`h-8 rounded-full px-3 ${
          currentView === "masonry"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="ml-1 text-sm">Grid</span>
      </Button>
      <Button
        variant={currentView === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className={`h-8 rounded-full px-3 ${
          currentView === "table"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Table className="h-4 w-4" />
        <span className="ml-1 text-sm">Table</span>
      </Button>
    </div>
  );
}