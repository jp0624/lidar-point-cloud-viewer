// src/simulation/TrafficLights.ts
export type LightPhase = "green" | "yellow" | "red";

/**
 * Controller for a two-phase intersection:
 * - NS (north-south) active while EW is inactive, and vice-versa.
 * - Each phase cycles: green -> yellow -> red (implicitly when other side is green).
 *
 * Use update(deltaMs) each frame. Provides:
 * - getNSPhase()/getEWPhase()
 * - getCountdownMs()/getCountdownSec()
 * - toggle() manual flip
 */
export class TrafficLights {
	// which side currently has green: "NS" or "EW"
	private currentGreen: "NS" | "EW" = "NS";

	// phase of the currently-green side (green -> yellow). We model as:
	// when currentGreen === "NS", NS is either green or yellow; EW is red.
	private phase: LightPhase = "green";

	// millisecond timers
	private timerMs = 0;

	// default durations (ms)
	public durations = {
		green: 7000,
		yellow: 2000,
		red: 7000, // red duration for opposite side is implicit but keep symmetric
	};

	// allow pausing automatic cycling
	public enabled = true;

	constructor(
		opts?: Partial<{ greenMs: number; yellowMs: number; redMs: number }>
	) {
		if (opts?.greenMs) this.durations.green = opts.greenMs;
		if (opts?.yellowMs) this.durations.yellow = opts.yellowMs;
		if (opts?.redMs) this.durations.red = opts.redMs;
	}

	update(deltaMs: number) {
		if (!this.enabled) return;

		this.timerMs += deltaMs;

		if (this.phase === "green" && this.timerMs >= this.durations.green) {
			this.phase = "yellow";
			this.timerMs = 0;
		} else if (
			this.phase === "yellow" &&
			this.timerMs >= this.durations.yellow
		) {
			// switch sides: the other side becomes green
			this.phase = "green";
			this.currentGreen = this.currentGreen === "NS" ? "EW" : "NS";
			this.timerMs = 0;
		}
		// Note: red is implicit for the opposite side while this side is green/yellow
	}

	// manual toggle (immediately flip green side and reset to green)
	toggle() {
		this.currentGreen = this.currentGreen === "NS" ? "EW" : "NS";
		this.phase = "green";
		this.timerMs = 0;
	}

	// enable/disable automatic cycling
	setEnabled(enabled: boolean) {
		this.enabled = enabled;
	}

	// returns the phase for NS side
	getNSPhase(): LightPhase {
		return this.currentGreen === "NS" ? this.phase : "red";
	}

	// returns phase for EW side
	getEWPhase(): LightPhase {
		return this.currentGreen === "EW" ? this.phase : "red";
	}

	// returns the countdown (ms) remaining for the active phase for the side that is green/yellow.
	// For convenience, return countdown for whichever side is currently green.
	getCountdownMs(): number {
		if (this.phase === "green")
			return Math.max(0, this.durations.green - this.timerMs);
		if (this.phase === "yellow")
			return Math.max(0, this.durations.yellow - this.timerMs);
		return 0; // Should not happen in this model
	}

	getCountdownSecRounded(): number {
		return Math.ceil(this.getCountdownMs() / 1000);
	}
}
