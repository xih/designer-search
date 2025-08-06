"use client";

import React from "react";
import { RefinementList, ClearRefinements } from "react-instantsearch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Filter, X } from "lucide-react";

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilterModal({ open, onOpenChange }: FilterModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Filters</DialogTitle>
            <ClearRefinements
              classNames={{
                button: "text-sm text-blue-600 hover:text-blue-800 font-medium",
              }}
            />
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Skills Filter */}
          <div>
            <h4 className="mb-3 font-medium text-gray-900">Skills</h4>
            <RefinementList
              attribute="skills"
              limit={10}
              showMore={true}
              classNames={{
                root: "space-y-2",
                item: "flex items-center",
                label: "ml-2 text-sm cursor-pointer text-gray-700 hover:text-gray-900",
                count: "ml-auto text-xs text-gray-500",
                checkbox:
                  "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
                showMore:
                  "mt-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium",
              }}
            />
          </div>

          {/* Companies Filter */}
          <div>
            <h4 className="mb-3 font-medium text-gray-900">Companies</h4>
            <RefinementList
              attribute="companies"
              limit={8}
              showMore={true}
              classNames={{
                root: "space-y-2",
                item: "flex items-center",
                label: "ml-2 text-sm cursor-pointer text-gray-700 hover:text-gray-900",
                count: "ml-auto text-xs text-gray-500",
                checkbox:
                  "h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500",
                showMore:
                  "mt-2 text-sm text-green-600 hover:text-green-800 cursor-pointer font-medium",
              }}
            />
          </div>

          {/* Job Titles Filter */}
          <div>
            <h4 className="mb-3 font-medium text-gray-900">Job Titles</h4>
            <RefinementList
              attribute="job_titles"
              limit={8}
              showMore={true}
              classNames={{
                root: "space-y-2",
                item: "flex items-center",
                label: "ml-2 text-sm cursor-pointer text-gray-700 hover:text-gray-900",
                count: "ml-auto text-xs text-gray-500",
                checkbox:
                  "h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500",
                showMore:
                  "mt-2 text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium",
              }}
            />
          </div>

          {/* Schools Filter */}
          <div>
            <h4 className="mb-3 font-medium text-gray-900">Schools</h4>
            <RefinementList
              attribute="schools"
              limit={6}
              showMore={true}
              classNames={{
                root: "space-y-2",
                item: "flex items-center",
                label: "ml-2 text-sm cursor-pointer text-gray-700 hover:text-gray-900",
                count: "ml-auto text-xs text-gray-500",
                checkbox:
                  "h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500",
                showMore:
                  "mt-2 text-sm text-purple-600 hover:text-purple-800 cursor-pointer font-medium",
              }}
            />
          </div>

          {/* Projects Filter */}
          <div>
            <h4 className="mb-3 font-medium text-gray-900">Projects</h4>
            <RefinementList
              attribute="project_names"
              limit={6}
              showMore={true}
              classNames={{
                root: "space-y-2",
                item: "flex items-center",
                label: "ml-2 text-sm cursor-pointer text-gray-700 hover:text-gray-900",
                count: "ml-auto text-xs text-gray-500",
                checkbox:
                  "h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500",
                showMore:
                  "mt-2 text-sm text-orange-600 hover:text-orange-800 cursor-pointer font-medium",
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FilterButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full border-2 hover:bg-gray-50"
    >
      <Filter className="h-4 w-4" />
      Filters
    </Button>
  );
}