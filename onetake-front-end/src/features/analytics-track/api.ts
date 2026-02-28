import { http } from '@/shared/api';
import { api } from '@/shared/config';
import type { TrackEventPayload } from './types';

export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  await http.post(api.endpoints.analytics.events, {
    eventName: payload.eventName,
    propsJson: payload.propsJson ?? '{}',
    entityType: payload.entityType ?? '',
    entityId: payload.entityId ?? '',
  });
}
