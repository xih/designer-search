"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetPortal,
  SheetOverlay,
} from "~/components/ui/sheet";
import type { ProfileHitOptional } from "~/types/typesense";
import { ProfileCard } from "./ProfileCard";

interface DesktopSheetProps {
  isOpen: boolean;
  selectedProfile: ProfileHitOptional | null;
  onOpenChange: (open: boolean) => void;
}

export function DesktopSheet({
  isOpen,
  selectedProfile,
  onOpenChange,
}: DesktopSheetProps) {
  return (
    <Sheet
      open={isOpen}
      modal={false}
      onOpenChange={(open) => {
        // Only respond to manual close events from the X button
        // Ignore automatic close events that happen during profile switching
        if (open && !isOpen) {
          onOpenChange(true);
        }
        // Note: We handle closing through our manual controls only
      }}
    >
      <SheetPortal>
        {/* Custom overlay with no opacity */}
        <SheetOverlay className="bg-transparent backdrop-blur-none" />
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Profile Details</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {selectedProfile && <ProfileCard profile={selectedProfile} />}
          </div>
        </SheetContent>
      </SheetPortal>
    </Sheet>
  );
}