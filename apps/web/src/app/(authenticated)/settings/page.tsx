'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Building2, Save } from 'lucide-react';
import { useSession } from '@/modules/auth/hooks/use-session';
import {
  useCurrentOrganisation,
  useUpdateOrganisation,
} from '@/modules/organisation/_hooks/use-organisation';
import {
  updateOrganisationSchema,
  type UpdateOrganisationFormValues,
} from '@/modules/organisation/_schemas/organisation.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { session } = useSession();
  const user = session.data;
  const orgQuery = useCurrentOrganisation();
  const updateMutation = useUpdateOrganisation();

  const isOwner = user?.role === 'OWNER';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateOrganisationFormValues>({
    resolver: zodResolver(updateOrganisationSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (orgQuery.data) {
      reset({ name: orgQuery.data.name });
    }
  }, [orgQuery.data, reset]);

  function onSubmit(values: UpdateOrganisationFormValues) {
    if (!isOwner) return;
    updateMutation.mutate(values);
  }

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm text-muted-foreground">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Organisation Settings</h1>
        <p className="mt-3 text-muted-foreground">
          Manage organisation profile and general settings.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">General Information</h2>
            <p className="text-sm text-muted-foreground">
              Update the business name associated with your FieldDesk workspace.
            </p>
          </div>
        </div>

        {orgQuery.isLoading ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-28 ml-auto max-w-md" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 max-w-md space-y-6">
            <div>
              <label htmlFor="org-name" className="block text-sm font-medium">
                Organisation Name
              </label>
              <Input
                id="org-name"
                disabled={!isOwner || updateMutation.isPending}
                className="mt-2"
                {...register('name')}
              />
              {errors.name?.message && (
                <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p>
              )}
              {!isOwner && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Only users with the Owner role can update organisation settings.
                </p>
              )}
            </div>

            {isOwner && (
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!isDirty || updateMutation.isPending}
                  className="gap-2"
                >
                  <Save className="size-4" />
                  {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
