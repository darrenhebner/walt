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

interface Item {
  beforeTransition(): void;
  afterTransition(): undefined | (() => void);
}

const TransitionScopeContext = createContext({
  items: new Set<Item>(),
});

function ScopeProvider({ children }: PropsWithChildren<{}>) {
  const context = useMemo(() => {
    return {
      items: new Set<Item>(),
    };
  }, []);

  return (
    <TransitionScopeContext.Provider value={context}>
      {children}
    </TransitionScopeContext.Provider>
  );
}

export function useViewTransition() {
  const { items } = useContext(TransitionScopeContext);

  return useCallback((callback: () => void) => {
    const pendingTransitions = new Set<Item>();

    items.forEach((item) => {
      item.beforeTransition();
      pendingTransitions.add(item);
    });

    flushSync(callback);
    const performers = Array.from(pendingTransitions).map((item) =>
      item.afterTransition()
    );
    performers.forEach((perform) => perform?.());
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
    const { items } = useContext(TransitionScopeContext);

    useEffect(() => {
      let before: DOMRect | undefined;

      const item: Item = {
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

      items.add(item);
      return () => {
        items.delete(item);
      };
    }, []);

    return (
      <Component ref={ref} {...props}>
        <ScopeProvider>{children}</ScopeProvider>
      </Component>
    );
  };
}
