'use server';

import { mutateLogiDesk, newCorrelationId } from '@/src/lib/api';
import { revalidatePath } from 'next/cache';

export async function createTeamAction(formData: FormData) {
  await createCatalog('/teams', formData);
}

export async function createCategoryAction(formData: FormData) {
  await createCatalog('/categories', formData);
}

export async function createTagAction(formData: FormData) {
  await createCatalog('/tags', formData);
}

export async function deactivateTeamAction(formData: FormData) {
  await deactivateCatalog('/teams', formData);
}

export async function deactivateCategoryAction(formData: FormData) {
  await deactivateCatalog('/categories', formData);
}

export async function deactivateTagAction(formData: FormData) {
  await deactivateCatalog('/tags', formData);
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const userId = optionalString(formData.get('userId')) ?? 'logidesk-web';
  await mutateLogiDesk(`/notification-preferences/${userId}`, 'PATCH', {
    inAppEnabled: formData.has('inAppEnabled'),
    emailEnabled: formData.has('emailEnabled'),
    assignmentEnabled: formData.has('assignmentEnabled'),
    slaEnabled: formData.has('slaEnabled'),
    messageEnabled: formData.has('messageEnabled'),
    correlationId: newCorrelationId(),
    actorId: 'logidesk-web',
  });
  revalidatePath('/settings');
}

async function createCatalog(path: string, formData: FormData) {
  await mutateLogiDesk(path, 'POST', {
    name: String(formData.get('name') ?? ''),
    description: optionalString(formData.get('description')),
    color: optionalString(formData.get('color')),
    correlationId: newCorrelationId(),
    actorId: 'logidesk-web',
  });
  revalidatePath('/settings');
}

async function deactivateCatalog(path: string, formData: FormData) {
  const id = String(formData.get('id') ?? '');
  await mutateLogiDesk(`${path}/${id}`, 'DELETE', {
    correlationId: newCorrelationId(),
    actorId: 'logidesk-web',
  });
  revalidatePath('/settings');
}

function optionalString(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : undefined;
}
