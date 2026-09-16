import { z } from 'zod';

export const sessionSchema = z.object({
  token: z.string().min(1),
  username: z.string().min(1),
  displayName: z.string(),
  userTypeId: z.number(),
  expiresAt: z.number(),
});
export type Session = z.infer<typeof sessionSchema>;
const key = 'finova.auth';
const listeners = new Set<() => void>();
let cached: Session | null = null;
try {
  const result = sessionSchema.safeParse(JSON.parse(sessionStorage.getItem(key) || 'null'));
  if (result.success && result.data.expiresAt > Date.now()) cached = result.data;
  else sessionStorage.removeItem(key);
} catch {
  sessionStorage.removeItem(key);
}
export const sessionStore = {
  get: () => cached,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  set(value: Session | null) {
    cached = value ? sessionSchema.parse(value) : null;
    if (cached) sessionStorage.setItem(key, JSON.stringify(cached));
    else sessionStorage.removeItem(key);
    listeners.forEach((listener) => listener());
  },
};
