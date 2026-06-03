type Listener = (event: AuditEvent) => void;

export class AuditStore {
  #max = 200;
  #items: AuditEvent[] = [];
  #listeners = new Set<Listener>();

  append(event: AuditEvent) {
    this.#items.push(event);
    if (this.#items.length > this.#max) {
      const overflow = this.#items.length - this.#max;
      this.#items.splice(0, overflow);
    }
    for (const listener of this.#listeners) {
      try {
        listener(event);
      } catch {
        // Swallow listener errors to keep the store stable
      }
    }
  }

  listAll() {
    return ([...this.#items] as AuditEvent[]).slice().reverse();
  }

  subscribe(listener: Listener) {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }
}

let store = new AuditStore();

export const setStore = (value: AuditStore) => {
  store = value;
};

export const auditStore = store;
