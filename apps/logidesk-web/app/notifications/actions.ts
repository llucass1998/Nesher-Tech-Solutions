'use server';

import { mutateLogiDesk } from '@/src/lib/api';
import { revalidatePath } from 'next/cache';

export async function markNotificationReadAction(formData: FormData) {
  const notificationId = String(formData.get('notificationId') ?? '').trim();
  if (!notificationId) {
    return;
  }

  await mutateLogiDesk(`/notifications/${notificationId}/read`, 'PATCH', {});
  revalidatePath('/notifications');
  revalidatePath('/');
}
