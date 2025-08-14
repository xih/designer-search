"use client";

import React from "react";
import { Drawer } from "vaul";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProfileHitOptional } from "~/types/typesense";
import { ProfileCard } from "./ProfileCard";

interface MobileDrawerProps {
  isOpen: boolean;
  selectedProfile: ProfileHitOptional | null;
  isProfileSwitching: boolean;
  isManuallyClosing: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function MobileDrawer({
  isOpen,
  selectedProfile,
  isProfileSwitching,
  isManuallyClosing,
  onOpenChange,
  onClose,
}: MobileDrawerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const shouldShowDrawer = isOpen;
  console.log("📱 [MOBILE-DRAWER-RENDER] Drawer render check:", {
    isOpen,
    shouldShowDrawer,
    selectedProfile: selectedProfile?.name,
    hypothesis: "Regular drawer without snap points",
  });

  if (!shouldShowDrawer) return null;

  return (
    <Drawer.Root
      open={isOpen}
      modal={false}
      dismissible={true}
      shouldScaleBackground={false}
      onOpenChange={(open) => {
        console.log("📱 [MOBILE-DRAWER-CHANGE] onOpenChange called:", {
          open,
          currentDrawerOpen: isOpen,
          isProfileSwitching,
          selectedProfile: selectedProfile?.name,
          isManuallyClosing,
          hypothesis: "Smooth close animation with dismissible=true",
        });

        onOpenChange(open);
      }}
    >
      <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <Drawer.Portal>
        <Drawer.Content 
          className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[60vh] flex-col rounded-t-[10px] border-t bg-white outline-none focus:outline-none focus-visible:outline-none"
          style={{ touchAction: 'pan-y' }}
        >
          <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-gray-300" />
          <div className="flex-1 overflow-y-auto p-4">
            {selectedProfile && (
              <>
                <div className="mb-4 flex items-start justify-between">
                  <Drawer.Title className="text-xl font-semibold">
                    Profile Details
                  </Drawer.Title>
                  <button
                    onClick={() => {
                      console.log(
                        "📱 [MOBILE-DRAWER-X-CLICK] X button clicked to close drawer",
                      );
                      onClose();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <ProfileCard profile={selectedProfile} />
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}