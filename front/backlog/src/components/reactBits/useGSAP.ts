"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

type UseGSAPParams = {
  scope?: React.RefObject<HTMLElement | null>;
  dependencies?: undefined[];
};

export function useGSAP(
  callback: (context: gsap.Context) => void,
  { scope, dependencies = [] }: UseGSAPParams = {},
) {
  const ctx = useRef<gsap.Context | null>(null);

  useLayoutEffect(() => {
    const element = scope?.current ?? undefined;
    ctx.current = gsap.context((self) => callback(self), element);

    return () => {
      ctx.current?.revert();
      ctx.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return ctx;
}
