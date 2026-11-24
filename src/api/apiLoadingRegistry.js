let pending = 0;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn(pending));
}

export function incrementApiPending() {
  pending += 1;
  emit();
}

export function decrementApiPending() {
  pending = Math.max(0, pending - 1);
  emit();
}

/** Subscribe to in-flight API count; returns unsubscribe. */
export function subscribeApiPending(callback) {
  callback(pending);
  listeners.add(callback);
  return () => listeners.delete(callback);
}
