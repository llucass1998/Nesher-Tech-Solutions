'use server';

import { mutateLogiDesk, newCorrelationId } from '@/src/lib/api';
import { revalidatePath } from 'next/cache';

export async function createTicketAction(formData: FormData) {
  await mutateLogiDesk('/tickets', 'POST', {
    subject: String(formData.get('subject') ?? ''),
    description: String(formData.get('description') ?? ''),
    priority: String(formData.get('priority') ?? 'MEDIUM'),
    requesterName: optionalString(formData.get('requesterName')),
    requesterEmail: optionalString(formData.get('requesterEmail')),
    teamId: optionalString(formData.get('teamId')),
    categoryId: optionalString(formData.get('categoryId')),
    assigneeId: optionalString(formData.get('assigneeId')),
    correlationId: newCorrelationId(),
    actorId: optionalString(formData.get('actorId')) ?? 'logidesk-web',
  });
  revalidatePath('/tickets');
}

export async function changeStatusAction(formData: FormData) {
  const id = String(formData.get('ticketId') ?? '');
  await mutateLogiDesk(`/tickets/${id}/status`, 'PATCH', {
    status: String(formData.get('status') ?? ''),
    reason: optionalString(formData.get('reason')),
    correlationId: newCorrelationId(),
    actorId: optionalString(formData.get('actorId')) ?? 'logidesk-web',
  });
  revalidatePath('/tickets');
  revalidatePath(`/tickets/${id}`);
}

export async function changePriorityAction(formData: FormData) {
  const id = String(formData.get('ticketId') ?? '');
  await mutateLogiDesk(`/tickets/${id}/priority`, 'PATCH', {
    priority: String(formData.get('priority') ?? ''),
    reason: optionalString(formData.get('reason')),
    correlationId: newCorrelationId(),
    actorId: optionalString(formData.get('actorId')) ?? 'logidesk-web',
  });
  revalidatePath('/tickets');
  revalidatePath(`/tickets/${id}`);
}

export async function assignTicketAction(formData: FormData) {
  const id = String(formData.get('ticketId') ?? '');
  await mutateLogiDesk(`/tickets/${id}/assign`, 'POST', {
    assigneeId: optionalString(formData.get('assigneeId')),
    assignedById: optionalString(formData.get('assignedById')) ?? 'logidesk-web',
    teamId: optionalString(formData.get('teamId')),
    reason: optionalString(formData.get('reason')),
    correlationId: newCorrelationId(),
  });
  revalidatePath('/tickets');
  revalidatePath(`/tickets/${id}`);
}

export async function changeTeamAction(formData: FormData) {
  const id = String(formData.get('ticketId') ?? '');
  await mutateLogiDesk(`/tickets/${id}/change-team`, 'POST', {
    teamId: optionalString(formData.get('teamId')),
    assignedById: optionalString(formData.get('assignedById')) ?? 'logidesk-web',
    reason: optionalString(formData.get('reason')),
    correlationId: newCorrelationId(),
  });
  revalidatePath('/tickets');
  revalidatePath(`/tickets/${id}`);
}

export async function createInternalNoteAction(formData: FormData) {
  const id = String(formData.get('ticketId') ?? '');
  await mutateLogiDesk(`/tickets/${id}/internal-notes`, 'POST', {
    authorId: optionalString(formData.get('authorId')) ?? 'logidesk-web',
    authorRole: 'SUPPORT',
    body: String(formData.get('body') ?? ''),
    correlationId: newCorrelationId(),
  });
  revalidatePath(`/tickets/${id}`);
}

function optionalString(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : undefined;
}
