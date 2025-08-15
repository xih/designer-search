import { Skeleton } from "~/components/ui/skeleton";

// Profile Skeleton Component using shadcn/ui
export function ProfileSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:p-4">
      {/* Profile Header */}
      <div className="mb-2 flex items-start justify-between md:mb-3">
        <div className="flex items-start space-x-2 md:space-x-3">
          <Skeleton className="h-12 w-12 rounded-full md:h-16 md:w-16" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Profile Info */}
      <div className="space-y-2 md:space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        
        {/* Badge */}
        <Skeleton className="h-6 w-20 rounded-full" />
        
        {/* Skills section */}
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <div className="flex flex-wrap gap-1">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        </div>
        
        {/* Companies section */}
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <div className="flex flex-wrap gap-1">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-18 rounded-full" />
          </div>
        </div>
        
        {/* Contact buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        {/* Portfolio button */}
        <Skeleton className="h-8 w-24 rounded" />
      </div>
    </div>
  );
}