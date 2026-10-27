/**
 * Copies the own prototype methods of each source onto `target`, bound to the
 * source instance. Used to keep a flat class API while implementations live in
 * small, focused modules.
 */
export function bindMethods(target: object, sources: object[]): void {
  for (const source of sources) {
    const prototype = Object.getPrototypeOf(source) as object;
    for (const key of Object.getOwnPropertyNames(prototype)) {
      if (key === "constructor") continue;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
      if (!descriptor || typeof descriptor.value !== "function") continue;
      (target as Record<string, unknown>)[key] = descriptor.value.bind(source);
    }
  }
}
