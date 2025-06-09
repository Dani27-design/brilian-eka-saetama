"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { NavigationEvents } from "@/components/NavigationEvents";

type NavigationContextType = {
  isNavigating: boolean;
};

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
});

export const useNavigation = () => useContext(NavigationContext);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <NavigationContext.Provider value={{ isNavigating }}>
      <NavigationEvents setIsNavigating={setIsNavigating} />
      {children}
    </NavigationContext.Provider>
  );
}
