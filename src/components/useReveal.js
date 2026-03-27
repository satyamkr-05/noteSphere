import { useEffect } from "react";

export function useReveal(deps = []) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    document.querySelectorAll(".reveal:not(.is-visible)").forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, deps);
}
