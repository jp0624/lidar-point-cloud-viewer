// src/simulation/TrafficLights.ts

export type PhaseColor = "green" | "yellow" | "red";
export type ArrowPhase = "off" | "green" | "yellow" | "red";
export type PedPhase = "walk" | "hand-blink" | "hand";

interface PhaseDef {
	name:
		| "NS_LEFT"
		| "NS_THROUGH"
		| "NS_YELLOW"
		| "ALL_RED_1"
		| "EW_LEFT"
		| "EW_THROUGH"
		| "EW_YELLOW"
		| "ALL_RED_2";
	durationSec: number;
}

// Simple TTC-like 8-phase cycle:
//  1) NS protected left
//  2) NS through
//  3) NS yellow
//  4) All red
//  5) EW protected left
//  6) EW through
//  7) EW yellow
//  8) All red
const PHASES: PhaseDef[] = [
	{ name: "NS_LEFT", durationSec: 4 },
	{ name: "NS_THROUGH", durationSec: 10 },
	{ name: "NS_YELLOW", durationSec: 3 },
	{ name: "ALL_RED_1", durationSec: 1 },
	{ name: "EW_LEFT", durationSec: 4 },
	{ name: "EW_THROUGH", durationSec: 10 },
	{ name: "EW_YELLOW", durationSec: 3 },
	{ name: "ALL_RED_2", durationSec: 1 },
];

export class TrafficLights {
	private phaseIndex = 0;
	private phaseElapsedMs = 0;

	update(deltaMs: number) {
		this.phaseElapsedMs += deltaMs;

		const current = PHASES[this.phaseIndex];
		if (this.phaseElapsedMs >= current.durationSec * 1000) {
			this.phaseIndex = (this.phaseIndex + 1) % PHASES.length;
			this.phaseElapsedMs = 0;
		}
	}

	private get current(): PhaseDef {
		return PHASES[this.phaseIndex];
	}

	getCountdownSecRounded(): number {
		const remaining = this.current.durationSec - this.phaseElapsedMs / 1000;
		return Math.max(0, Math.round(remaining));
	}

	// ------------------------------
	// Main ball heads (through lanes)
	// ------------------------------
	getNSPhase(): PhaseColor {
		switch (this.current.name) {
			case "NS_LEFT":
			case "NS_THROUGH":
				return "green";
			case "NS_YELLOW":
				return "yellow";
			default:
				return "red";
		}
	}

	getEWPhase(): PhaseColor {
		switch (this.current.name) {
			case "EW_LEFT":
			case "EW_THROUGH":
				return "green";
			case "EW_YELLOW":
				return "yellow";
			default:
				return "red";
		}
	}

	// ------------------------------
	// Protected left arrow heads
	// ------------------------------
	getNSLeftPhase(): ArrowPhase {
		switch (this.current.name) {
			case "NS_LEFT":
				return "green";
			case "NS_YELLOW":
				return "yellow";
			default:
				return "off";
		}
	}

	getEWLeftPhase(): ArrowPhase {
		switch (this.current.name) {
			case "EW_LEFT":
				return "green";
			case "EW_YELLOW":
				return "yellow";
			default:
				return "off";
		}
	}

	// ------------------------------
	// Pedestrian heads (WALK / HAND)
	// TTC-ish: WALK during through-green,
	// blinking HAND during yellow, solid HAND otherwise.
	// ------------------------------
	getPedNSPhase(): PedPhase {
		switch (this.current.name) {
			case "NS_THROUGH":
				return "walk";
			case "NS_YELLOW":
				return "hand-blink";
			default:
				return "hand";
		}
	}

	getPedEWPhase(): PedPhase {
		switch (this.current.name) {
			case "EW_THROUGH":
				return "walk";
			case "EW_YELLOW":
				return "hand-blink";
			default:
				return "hand";
		}
	}
}
