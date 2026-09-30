import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`}
      {...props}
    />
  );
};

// Skeleton para las tarjetas del catálogo de servicios en SolicitantPortal
export const ServiceCatalogSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between w-full">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <Skeleton className="w-24 h-5 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="w-3/4 h-5 rounded-lg" />
            <Skeleton className="w-full h-3 rounded-md" />
            <Skeleton className="w-5/6 h-3 rounded-md" />
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <Skeleton className="w-32 h-4 rounded-md" />
            <Skeleton className="w-4 h-4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton para la lista de requerimientos en Mis Requerimientos (SolicitantPortal)
export const TicketListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="divide-y divide-slate-100 animate-in fade-in duration-200">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 sm:p-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="w-28 h-6 rounded-lg" />
            <Skeleton className="w-20 h-5 rounded-md" />
            <Skeleton className="w-24 h-5 rounded-md" />
            <Skeleton className="w-16 h-5 rounded-md" />
          </div>
          <Skeleton className="w-2/3 h-5 rounded-lg" />
          <Skeleton className="w-1/2 h-4 rounded-md" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="w-36 h-4 rounded-md" />
            <Skeleton className="w-24 h-4 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton para filas de tablas (SpecialistDashboard y TechnicianAttendedTicketsPage)
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6,
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx} className="py-4 px-4">
              <Skeleton
                className={`h-4 rounded-md ${
                  cIdx === 0
                    ? 'w-24'
                    : cIdx === 1
                    ? 'w-48'
                    : cIdx === 2
                    ? 'w-32'
                    : 'w-20'
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// Skeleton para la vista completa de Detalle de Ticket (TicketDetailPage)
export const TicketDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-300">
      {/* Top Header Card Skeleton */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <Skeleton className="w-32 h-6 rounded-xl" />
          <div className="flex items-center space-x-2">
            <Skeleton className="w-28 h-8 rounded-xl" />
            <Skeleton className="w-28 h-8 rounded-xl" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-36 h-8 rounded-xl" />
              <Skeleton className="w-24 h-6 rounded-lg" />
              <Skeleton className="w-20 h-6 rounded-lg" />
            </div>
            <Skeleton className="w-80 h-7 rounded-xl" />
          </div>
          <Skeleton className="w-36 h-10 rounded-2xl" />
        </div>
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General info card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <Skeleton className="w-48 h-6 rounded-xl" />
            <div className="space-y-2 pt-2">
              <Skeleton className="w-full h-4 rounded-md" />
              <Skeleton className="w-full h-4 rounded-md" />
              <Skeleton className="w-3/4 h-4 rounded-md" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          </div>

          {/* Attachments card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <Skeleton className="w-40 h-6 rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          </div>
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-6">
          {/* Technician card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <Skeleton className="w-44 h-6 rounded-xl" />
            <div className="flex items-center space-x-3 pt-2">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="w-3/4 h-4 rounded-md" />
                <Skeleton className="w-1/2 h-3 rounded-md" />
              </div>
            </div>
          </div>

          {/* Timeline card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <Skeleton className="w-40 h-6 rounded-xl" />
            <div className="space-y-3 pt-2">
              <Skeleton className="w-full h-14 rounded-2xl" />
              <Skeleton className="w-full h-14 rounded-2xl" />
              <Skeleton className="w-full h-14 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
