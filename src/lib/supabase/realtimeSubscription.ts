// Supabase Realtime subscription for live preview updates
import { supabase } from './client';
import type { AppSchema } from '@/lib/builder/appSchema';

export function subscribeToProjectUpdates(
  projectId: string,
  onSchemaUpdate: (schema: AppSchema) => void,
  onError: (error: Error) => void
): () => void {
  console.log('[Realtime] Subscribing to project updates:', projectId);

  const channel = supabase
    .channel(`projects:${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${projectId}`,
      } as any,
      (payload: any) => {
        console.log('[Realtime] Event received:', payload.eventType);

        if (payload.new && payload.new.schema) {
          console.log('[Realtime] Schema updated, refreshing preview');
          try {
            onSchemaUpdate(payload.new.schema);
          } catch (error) {
            console.error('[Realtime] Error updating preview:', error);
            onError(error instanceof Error ? error : new Error('Unknown error'));
          }
        }
      }
    )
    .subscribe((status: any) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Successfully subscribed');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Channel error - Realtime may not be enabled');
        onError(new Error('Realtime connection failed'));
      } else if (status === 'CLOSED') {
        console.log('[Realtime] Channel closed');
      }
    });

  // Return unsubscribe function
  return () => {
    console.log('[Realtime] Unsubscribing from project updates');
    supabase.removeChannel(channel);
  };
}

export function subscribeToFileUpdates(
  userId: string,
  onFileUpdate: (file: any) => void
): () => void {
  console.log('[Realtime] Subscribing to file updates for user:', userId);

  const channel = supabase
    .channel(`user_files:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_files',
        filter: `user_id=eq.${userId}`,
      } as any,
      (payload: any) => {
        console.log('[Realtime] File event:', payload.eventType);
        if (payload.new) {
          onFileUpdate(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    console.log('[Realtime] Unsubscribing from file updates');
    supabase.removeChannel(channel);
  };
}
