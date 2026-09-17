"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollRevealProvider({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Enable modern scroll reveal animations once client is mounted
    document.documentElement.classList.add("js-reveal-active");

    const observerCallback: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.1,
    });

    const attachObservers = () => {
      const elements = document.querySelectorAll(".reveal-init:not(.revealed)");
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // If element is already in the visible screen on load, reveal immediately
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add("revealed");
        } else {
          observer.observe(el);
        }
      });
    };

    // Attach initially and after brief delay for hydration
    attachObservers();
    const timer = setTimeout(attachObservers, 150);

    // Reveal visible elements on scroll/resize
    window.addEventListener("scroll", attachObservers, { passive: true });
    window.addEventListener("resize", attachObservers, { passive: true });

    // Watch for dynamically added elements
    const mutationObserver = new MutationObserver(() => {
      attachObservers();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", attachObservers);
      window.removeEventListener("resize", attachObservers);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return <>{children}</>;
}
