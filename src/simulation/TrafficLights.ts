// src/simulation/TrafficLights.ts

export class TrafficLights {
	private timer: number = 0;

	// Cycle durations in milliseconds
	private GREEN_TIME = 7000;
	private YELLOW_TIME = 2000;
	private RED_TIME = 7000;

	private cycleLength = this.GREEN_TIME + this.YELLOW_TIME + this.RED_TIME;

	/**
	 * Update the signal timer
	 * @param dt - delta time in milliseconds
	 */
	update(dt: number) {
		this.timer += dt;
		if (this.timer > this.cycleLength) {
			this.timer -= this.cycleLength;
		}
	}

	/**
	 * Compute current NS phase
	 */
	getNSPhase(): "green" | "yellow" | "red" {
		const t = this.timer;

		if (t < this.GREEN_TIME) return "green";
		if (t < this.GREEN_TIME + this.YELLOW_TIME) return "yellow";
		return "red";
	}

	/**
	 * EW is always opposite cycle:
	 * - NS green → EW red
	 * - NS yellow → EW red
	 * - NS red → EW green
	 */
	getEWPhase(): "green" | "yellow" | "red" {
		const ns = this.getNSPhase();
		switch (ns) {
			case "green":
			case "yellow":
				return "red";
			case "red":
				return "green";
		}
	}

	/**
	 * Countdown until NS phase changes (rounded seconds)
	 */
	getCountdownSecRounded(): number {
		const t = this.timer;
		let remaining = 0;

		if (t < this.GREEN_TIME) {
			remaining = this.GREEN_TIME - t;
		} else if (t < this.GREEN_TIME + this.YELLOW_TIME) {
			remaining = this.GREEN_TIME + this.YELLOW_TIME - t;
		} else {
			remaining = this.cycleLength - t;
		}

		return Math.ceil(remaining / 1000);
	}
}
