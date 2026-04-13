import type { EventType, VaultEvent } from '@/types';

type EventHandler = (event: VaultEvent) => void;

class EventBus {
  private handlers: Map<EventType, Set<EventHandler>> = new Map();

  on(type: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  emit(type: EventType, payload?: unknown): void {
    const event: VaultEvent = {
      type,
      timestamp: Date.now(),
      payload,
    };

    this.handlers.get(type)?.forEach((handler) => {
      try {
        handler(event);
      } catch (e) {
        console.error(`Event handler error for ${type}:`, e);
      }
    });
  }
}

export const eventBus = new EventBus();
