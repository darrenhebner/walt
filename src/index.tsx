import {
  PropsWithChildren,
  useCallback,
  useRef,
  useEffect,
  createContext,
  useContext,
  useMemo,
  ComponentPropsWithoutRef,
  JSX,
} from "react";
import { flushSync } from "react-dom";

interface Performer {
  beforeTransition(): void;
  afterTransition(): undefined | (() => void);
}

const ScopeContext = createContext({
  performers: new Set<Performer>(),
});

export function Scope({ children }: PropsWithChildren<{}>) {
  const context = useMemo(() => {
    return {
      performers: new Set<Performer>(),
    };
  }, []);

  return (
    <ScopeContext.Provider value={context}>{children}</ScopeContext.Provider>
  );
}

export function useViewTransition() {
  const { performers } = useContext(ScopeContext);

  return useCallback((callback: () => void) => {
    const pending = new Set<Performer>();

    performers.forEach((performer) => {
      performer.beforeTransition();
      pending.add(performer);
    });

    flushSync(callback);

    const pendingPerformances = Array.from(pending).map((performer) =>
      performer.afterTransition()
    );
    pendingPerformances.forEach((perform) => perform?.());
  }, []);
}

const cache = new Map();

type ElementProps<T extends keyof JSX.IntrinsicElements> = Record<
  T,
  ReturnType<typeof createComponent<T>>
>;

export const animate = new Proxy(
  {} as ElementProps<keyof JSX.IntrinsicElements>,
  {
    get(_, Component: keyof JSX.IntrinsicElements) {
      if (cache.has(Component)) {
        return cache.get(Component);
      }

      const result = createComponent(Component);
      cache.set(Component, result);
      return result;
    },
  }
);

function createComponent<T extends keyof JSX.IntrinsicElements>(Component: T) {
  return function TransitionItem({
    children,
    ...props
  }: ComponentPropsWithoutRef<T>) {
    const ref = useRef<HTMLDivElement>(null);
    const { performers } = useContext(ScopeContext);

    useEffect(() => {
      let before: DOMRect | undefined;

      const item: Performer = {
        beforeTransition() {
          if (!ref.current) return;
          before = ref.current.getBoundingClientRect();
        },
        afterTransition() {
          if (!ref.current || before == null) return;

          const after = ref.current!.getBoundingClientRect();
          const verticalDiff = before.y - after.y;
          const horizontalDiff = before.x - after.x;

          if (verticalDiff === 0 && horizontalDiff === 0) return;

          const start = {
            transform: `translate(${horizontalDiff}px, ${verticalDiff}px)`,
          };

          const end = {
            transform: `translate(0, 0)`,
          };

          before = undefined;

          return () => {
            ref.current?.animate([start, end], {
              duration: 400,
              easing: "ease-in-out",
            });
          };
        },
      };

      performers.add(item);
      return () => {
        performers.delete(item);
      };
    }, []);

    const C = Component as any;

    return (
      <C ref={ref} {...props}>
        <Scope>{children}</Scope>
      </C>
    );
  };
}
