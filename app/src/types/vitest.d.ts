declare module "vitest" {
  export type TestCallback = () => void | Promise<void>;

  export function describe(name: string, fn: TestCallback): void;
  export function it(name: string, fn: TestCallback): void;

  interface NumberMatchers {
    toBeCloseTo(expected: number, precision?: number): void;
    toBeGreaterThan(expected: number): void;
    toBeLessThan(expected: number): void;
  }

  interface Matchers {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeCloseTo(expected: number, precision?: number): void;
    toBeGreaterThan(expected: number): void;
    toBeLessThan(expected: number): void;
  }

  export function expect(actual: number): NumberMatchers;
  export function expect<T>(actual: T): Matchers;
}
