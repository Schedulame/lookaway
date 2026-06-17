import type { EventMap } from '../types'

type Handler<T> = T extends void ? () => void : (payload: T) => void

type Listeners = {
  [K in keyof EventMap]?: Set<Handler<EventMap[K]>>
}

const listeners: Listeners = {}

export function on<K extends keyof EventMap>(
  event: K,
  handler: Handler<EventMap[K]>
): () => void {
  if (!listeners[event]) {
    listeners[event] = new Set() as any
  }
  ;(listeners[event] as Set<Handler<EventMap[K]>>).add(handler)
  return () => off(event, handler)
}

export function off<K extends keyof EventMap>(
  event: K,
  handler: Handler<EventMap[K]>
): void {
  ;(listeners[event] as Set<Handler<EventMap[K]>> | undefined)?.delete(handler)
}

export function emit<K extends keyof EventMap>(
  event: K,
  ...args: EventMap[K] extends void ? [] : [EventMap[K]]
): void {
  const set = listeners[event] as Set<Handler<EventMap[K]>> | undefined
  if (!set) return
  set.forEach((h) => (h as any)(...args))
}
