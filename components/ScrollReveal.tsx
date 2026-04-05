"use client";

import { useEffect, useRef, useState, ReactNode, CSSProperties } from "react";

interface ScrollRevealProps {
  children?: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  duration?: number;
  delay?: number;
  margin?: string;
  once?: boolean;
  as?: "div" | "a" | "span" | "section";
  href?: string;
  target?: string;
  rel?: string;
  style?: CSSProperties;
}

export default function ScrollReveal({
  children,
  className = "",
  direction = "up",
  duration = 0.5,
  delay = 0,
  margin = "0px",
  once = true,
  as: Component = "div",
  ...props
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { rootMargin: margin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [margin, once]);

  const getTransform = () => {
    switch (direction) {
      case "up":
        return "translateY(-20px)";
      case "down":
        return "translateY(20px)";
      case "left":
        return "translateX(-20px)";
      case "right":
        return "translateX(20px)";
      default:
        return "translateY(-20px)";
    }
  };

  const animationStyle: CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translate(0, 0)" : getTransform(),
    transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
  };

  return (
    <Component
      ref={ref as any}
      className={className}
      style={{ ...animationStyle, ...props.style }}
      {...(Component === "a" ? { href: props.href, target: props.target, rel: props.rel } : {})}
    >
      {children}
    </Component>
  );
}
