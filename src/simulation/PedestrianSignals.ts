// Ultra-realistic pedestrian crossing controller

export type PedPhase = "walk" | "flash" | "dont";

export class PedestrianSignals {
	// Last state for each crossing
	private pedNS: PedPhase = "dont";
	private pedEW: PedPhase = "dont";

	// timing control
	private walkTime = 4000;


	private nsTimer = 0;
	private ewTimer = 0;

	update(
		dt: number,
		nsPhase: "green" | "yellow" | "red",
		ewPhase: "green" | "yellow" | "red"
	) {
		// NS — pedestrians cross E-W across NS road
		this.updatePed(
			dt,
			nsPhase,
			(v) => (this.pedNS = v),
			() => this.pedNS === "walk",
			() => (this.nsTimer += dt),
			() => (this.nsTimer = 0)
		);

		// EW — pedestrians cross N-S across EW road
		this.updatePed(
			dt,
			ewPhase,
			(v) => (this.pedEW = v),
			() => this.pedEW === "walk",
			() => (this.ewTimer += dt),
			() => (this.ewTimer = 0)
		);
	}

	private updatePed(
		_dt: number,
		light: "green" | "yellow" | "red",
		setPhase: (p: PedPhase) => void,
		isWalk: () => boolean,
		addTimer: () => void,
		resetTimer: () => void
	) {
		// Green light: allow WALK at start of cycle only
		if (light === "green") {
			if (!isWalk()) resetTimer();
			addTimer();

			if (this.walkTime > 0 && this.walkTime - this.getTimer(light) >= 0) {
				setPhase("walk");
				return;
			}

			// After walk, but before yellow
			setPhase("flash");
			return;
		}

		// Yellow phase → FLASH (don't enter)
		if (light === "yellow") {
			setPhase("flash");
			return;
		}

		// Red → Solid DON'T WALK
		setPhase("dont");
	}

	private getTimer(light: "green" | "yellow" | "red") {
		if (light === "green") return this.walkTime;
		return 0;
	}

	getNS(): PedPhase {
		return this.pedNS;
	}

	getEW(): PedPhase {
		return this.pedEW;
	}

	// Useful UI helper
	getSymbolFor(p: PedPhase) {
		switch (p) {
			case "walk":
				return "🚶";
			case "flash":
				return "⚠️";
			default:
				return "✋";
		}
	}
}
