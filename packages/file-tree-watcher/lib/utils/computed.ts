import { Signal } from "signal-polyfill";

/**
 * forked from `signal-utils` package (source code at [`signal-utils/src/index.ts`](https://github.com/proposal-signals/signal-utils/blob/8df8be37a4f835ebe66a1ccce0fd39e0856f1c4c/src/index.ts#L104-L125)).
 */
export function computed<Value>(
  target: () => Value,
  context: ClassGetterDecoratorContext,
): () => Value {
  const kind = context.kind;

  if (kind !== "getter") {
    throw new Error(`Can only use @cached on getters.`);
  }

  const caches = new WeakMap<typeof target, WeakMap<object, Signal.Computed<Value>>>();

  return function (this: unknown) {
    let cache = caches.get(target);
    if (!cache) {
      cache = new WeakMap();
      caches.set(target, cache);
    }
    let effect = cache.get(this as object);
    if (!effect) {
      effect = new Signal.Computed(() => target.call(this));
      cache.set(this as object, effect);
    }

    return effect.get();
  };
}
