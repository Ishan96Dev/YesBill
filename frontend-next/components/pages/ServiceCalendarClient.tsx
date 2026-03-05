'use client'
export default function ServiceCalendarClient({ serviceId }: { serviceId: string }) {
  return <div className="min-h-screen" data-service-id={serviceId} />
}
