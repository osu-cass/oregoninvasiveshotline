import { atom } from "jotai";
import { LocationPlacementType } from "./types";

export const locationPlacementTypeAtom = atom<LocationPlacementType>(
	LocationPlacementType.OTHER,
);
