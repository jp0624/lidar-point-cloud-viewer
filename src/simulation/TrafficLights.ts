// src/simulation/TrafficLights.ts

export type PhaseColor = "red" | "yellow" | "green";
export type PedPhase = "walk" | "stop";

export interface ApproachPhases {
	straight: PhaseColor;
	left: PhaseColor;
	right: PhaseColor;
}

export interface PedPhases {
	acrossNS: PedPhase; // crossing the N–S roadway (east-west crosswalks)
	acrossEW: PedPhase; // crossing the E–W roadway (north-south crosswalks)
}

export interface FullPhases {
	NS: ApproachPhases;
	EW: ApproachPhases;
	ped: PedPhases;
}

export class TrafficLights {
	private timeMs = 0;
	private readonly cycleMs = 28000; // 28s full cycle
	private phases: FullPhases;
	private countdownSec = 0;

	constructor() {
		this.phases = {
			NS: { straight: "red", left: "red", right: "red" },
			EW: { straight: "red", left: "red", right: "red" },
			ped: { acrossNS: "stop", acrossEW: "stop" },
		};
	}

	update(deltaMs: number) {
		this.timeMs = (this.timeMs + deltaMs) % this.cycleMs;
		const t = this.timeMs / 1000; // seconds

		let ns: ApproachPhases = {
			straight: "red",
			left: "red",
			right: "red",
		};
		let ew: ApproachPhases = {
			straight: "red",
			left: "red",
			right: "red",
		};

		// Timeline (seconds)
		// 0–8:   NS straight+right green, EW red
		// 8–10:  NS yellow, EW red
		// 10–12: NS left green (protected), others red
		// 12–14: all red (clearance)
		// 14–22: EW straight+right green, NS red
		// 22–24: EW yellow, NS red
		// 24–26: EW left green (protected), others red
		// 26–28: all red (clearance)
		const tSec = t;

		if (tSec < 8) {
			ns.straight = "green";
			ns.right = "green";
		} else if (tSec < 10) {
			ns.straight = "yellow";
			ns.right = "yellow";
		} else if (tSec < 12) {
			ns.left = "green";
		} else if (tSec < 14) {
			// all red
		} else if (tSec < 22) {
			ew.straight = "green";
			ew.right = "green";
		} else if (tSec < 24) {
			ew.straight = "yellow";
			ew.right = "yellow";
		} else if (tSec < 26) {
			ew.left = "green";
		} else {
			// 26–28 all red
		}

		this.phases.NS = ns;
		this.phases.EW = ew;

		// Pedestrians:
		// - acrossNS (east-west crosswalks) are allowed when NS straight is red
		// - acrossEW (north-south crosswalks) are allowed when EW straight is red
		const nsRed = ns.straight === "red" && ns.left !== "green";
		const ewRed = ew.straight === "red" && ew.left !== "green";

		this.phases.ped = {
			acrossNS: nsRed ? "walk" : "stop",
			acrossEW: ewRed ? "walk" : "stop",
		};

		// Simple countdown: seconds remaining in the current cycle
		this.countdownSec = Math.ceil((this.cycleMs - this.timeMs) / 1000);
	}

	getPhases(): FullPhases {
		return this.phases;
	}

	getCountdownSecRounded(): number {
		return this.countdownSec;
	}
}
