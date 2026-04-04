type EventHandler<T> = (payload: T) => void;

export class EventBus<TEvents extends object> {
  private handlers = new Map<keyof TEvents, Set<EventHandler<TEvents[keyof TEvents]>>>();

  on<TKey extends keyof TEvents>(
    event: TKey,
    handler: EventHandler<TEvents[TKey]>,
  ): () => void {
    const existing = this.handlers.get(event) ?? new Set();
    existing.add(handler as EventHandler<TEvents[keyof TEvents]>);
    this.handlers.set(event, existing);

    return () => {
      existing.delete(handler as EventHandler<TEvents[keyof TEvents]>);

      if (existing.size === 0) {
        this.handlers.delete(event);
      }
    };
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    this.handlers.get(event)?.forEach((handler) => {
      handler(payload as TEvents[keyof TEvents]);
    });
  }

  clear(): void {
    this.handlers.clear();
  }
}
