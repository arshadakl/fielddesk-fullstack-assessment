'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, CheckCircle2, Clock, MapPin, MessageSquare, Play, User as UserIcon, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/modules/auth/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useUpdateWorkOrderStatus,
  useWorkOrder,
  useWorkOrderEvents,
} from '@/modules/work-orders/_hooks/use-work-orders';
import { PriorityBadge, StatusBadge } from '@/modules/work-orders/_components/badges';
import { formatScheduleWindow } from '@/modules/work-orders/_utils/schedule-formatter';
import { AssignTechnicianDialog } from '../_components/assign-technician-dialog';
import { ActivityTimeline } from '@/modules/work-orders/_components/activity-timeline';
import { AttachmentsPanel } from '@/modules/work-orders/_components/attachments-panel';
import {
  SubmitProgressDialog,
  type ProgressDialogConfig,
} from '@/modules/work-orders/_components/submit-progress-dialog';

export default function WorkOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useSession();
  const user = session.data;

  const [assignOpen, setAssignOpen] = React.useState(false);
  const [progressConfig, setProgressConfig] = React.useState<ProgressDialogConfig | null>(null);

  const { data: order, isLoading } = useWorkOrder(params.id);
  const { data: events, isLoading: eventsLoading } = useWorkOrderEvents(params.id);
  const updateStatusMutation = useUpdateWorkOrderStatus();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold">Work Order Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested work order does not exist or you do not have permission to view it.
        </p>
        <Button variant="outline" asChild>
          <Link href="/work-orders">
            <ArrowLeft className="size-4" />
            Back to Work Orders
          </Link>
        </Button>
      </div>
    );
  }

  const isTechnician = user?.role === 'TECHNICIAN';
  const isAssignedToMe = isTechnician && order.assignedTechnicianId === user?.id;

  async function handleDirectCancel() {
    if (!order) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: order.id,
        input: { status: 'CANCELLED' },
      });
      toast.success('Work order cancelled');
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Failed to cancel work order';
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary">{order.reference}</span>
              <StatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{order.title}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dispatcher/Owner Assignment */}
          {!isTechnician && order.status !== 'COMPLETED' && order.status !== 'IN_PROGRESS' && (
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              <Calendar className="size-4" />
              {order.assignedTechnicianId ? 'Reassign / Reschedule' : 'Assign Technician'}
            </Button>
          )}

          {/* Progress Note Action (Available to assigned technician or dispatcher/owner) */}
          {(isAssignedToMe || !isTechnician) && order.status !== 'CANCELLED' && (
            <Button
              variant="outline"
              onClick={() =>
                setProgressConfig({
                  type: 'NOTE_ADDED',
                  title: 'Add Progress Note',
                  description: 'Record an observation, site note, or progress update for this job.',
                })
              }
            >
              <MessageSquare className="size-4" />
              Add Note
            </Button>
          )}

          {/* Technician: Start Work */}
          {isAssignedToMe && order.status === 'SCHEDULED' && (
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() =>
                setProgressConfig({
                  type: 'WORK_STARTED',
                  targetStatus: 'IN_PROGRESS',
                  title: 'Start Work Order',
                  description: 'Transition status to In Progress and record commencement details.',
                })
              }
            >
              <Play className="size-4" />
              Start Work
            </Button>
          )}

          {/* Technician: Complete Work */}
          {isAssignedToMe && order.status === 'IN_PROGRESS' && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() =>
                setProgressConfig({
                  type: 'WORK_COMPLETED',
                  targetStatus: 'COMPLETED',
                  title: 'Mark as Completed',
                  description: 'Confirm that this job is finished and record any final resolution notes.',
                })
              }
            >
              <CheckCircle2 className="size-4" />
              Mark as Completed
            </Button>
          )}

          {/* Dispatcher / Owner: Cancel Job */}
          {!isTechnician && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={handleDirectCancel}
              disabled={updateStatusMutation.isPending}
            >
              <XCircle className="size-4" />
              Cancel Job
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold">Description & Scope</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
              {order.description}
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold">Job Details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Site Location</dt>
                  <dd className="mt-1 text-sm font-medium">{order.siteName}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserIcon className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Created By</dt>
                  <dd className="mt-1 text-sm font-medium">{order.creatorName}</dd>
                </div>
              </div>
            </dl>
          </section>

          {/* Activity History & Audit Trail */}
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-semibold">Activity & Audit History</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Immutable chronological audit log of all events and transitions.
                </p>
              </div>
              {(isAssignedToMe || !isTechnician) && order.status !== 'CANCELLED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setProgressConfig({
                      type: 'NOTE_ADDED',
                      title: 'Add Progress Note',
                      description: 'Record an observation or field update.',
                    })
                  }
                >
                  <MessageSquare className="size-3.5" />
                  Add Note
                </Button>
              )}
            </div>

            <ActivityTimeline events={events} isLoading={eventsLoading} />
          </section>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold">Assignment & Schedule</h2>
            <div className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-muted-foreground">Assigned Technician</span>
                <p className="mt-1 text-sm font-medium">
                  {order.assignedTechnicianName ? (
                    order.assignedTechnicianName
                  ) : (
                    <span className="text-muted-foreground italic">No technician assigned</span>
                  )}
                </p>
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Scheduled Window</span>
                {(() => {
                  const schedule = formatScheduleWindow(order.scheduledStart, order.scheduledEnd);
                  if (!schedule) {
                    return <p className="mt-1 text-sm text-muted-foreground italic">No schedule set</p>;
                  }
                  return (
                    <div className="mt-1 flex items-start gap-2 text-sm">
                      <Clock className="mt-0.5 size-4 text-primary shrink-0" />
                      <div>
                        <div className="font-medium text-foreground">{schedule.primary}</div>
                        <div className="text-xs text-muted-foreground">{schedule.secondary}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {!isTechnician && order.status !== 'COMPLETED' && order.status !== 'IN_PROGRESS' && (
                <div className="pt-2 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setAssignOpen(true)}
                  >
                    <Calendar className="size-3.5" />
                    {order.assignedTechnicianId ? 'Reassign / Reschedule' : 'Assign Technician'}
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Attachments & Photos Panel */}
          <AttachmentsPanel
            workOrderId={order.id}
            isTechnician={isTechnician}
            isAssignedToMe={isAssignedToMe}
            currentUserId={user?.id}
            isOwner={user?.role === 'OWNER'}
          />
        </div>
      </div>

      <AssignTechnicianDialog
        workOrder={assignOpen ? order : null}
        onClose={() => setAssignOpen(false)}
      />

      {progressConfig && (
        <SubmitProgressDialog
          workOrderId={order.id}
          config={progressConfig}
          onClose={() => setProgressConfig(null)}
        />
      )}
    </div>
  );
}
