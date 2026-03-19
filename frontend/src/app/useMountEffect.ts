import { type EffectCallback, useEffect } from "react";

export function useMountEffect(effect: EffectCallback) {
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => effect(), []);
}
