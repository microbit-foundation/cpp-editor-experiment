import { createContext, useContext } from "react";
import { HexGenerator } from "./hex-gen";

const HexGenContext = createContext<HexGenerator | undefined>(undefined);

export const HexGenProvider = HexGenContext.Provider;

export const useHexGeneration = () => {
  const generator = useContext(HexGenContext);
  if (!generator) {
    throw new Error("Missing provider");
  }
  return generator;
};
