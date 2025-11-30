// src/hooks/useTrafficSimulation.ts
import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { TrafficEngine } from "../simulation/TrafficEngine";
import type { Entity } from "../simulation/TrafficEngine";
import { TrafficLights } from "../simulation/TrafficLights";
import { PedestrianSignals } from "../simulation/PedestrianSignals";
import type { SimConfig } from "../types/SceneTypes";
import * as THREE from "three";

export interface SimulationState {
	entities: Entity[];
	trafficLightPhases: {
		NS: "green" | "yellow" | "red";
		EW: "green" | "yellow" | "red";
		pedNS: "walk" | "flash" | "dont";
		pedEW: "walk" | "flash" | "dont";
		countdown: number;
	};
}

export function useTrafficSimulation(
	engine: TrafficEngine,
	config: SimConfig
): SimulationState {
	const [state, setState] = useState<SimulationState>({
		entities: [],
		trafficLightPhases: {
			NS: "green",
			EW: "red",
			pedNS: "dont",
			pedEW: "dont",
			countdown: 0,
		},
	});

	const clockRef = useRef(new THREE.Clock());
	const lightsRef = useRef(new TrafficLights());
	const pedRef = useRef(new PedestrianSignals());

	// ===========================================================
	// ENTITY POPULATION (when user toggles settings)
	// ===========================================================
	useEffect(() => {
		engine.reset();

		// Primary vehicle lanes
		const maxCarCount = Math.floor(engine.getMaxEntities() * 0.7);
		const count = Math.ceil(config.trafficDensity * maxCarCount);

		for (let i = 0; i < count; i++) {
			engine.spawn({
				type: Math.random() > 0.1 ? "Car" : "Truck",
			});
		}

		if (config.bicycleEnabled) {
			for (let i = 0; i < 6; i++) engine.spawn({ type: "Bicycle" });
		}
		if (config.pedestrianEnabled) {
			for (let i = 0; i < 10; i++) engine.spawn({ type: "Pedestrian" });
		}
	}, [
		engine,
		config.trafficDensity,
		config.bicycleEnabled,
		config.pedestrianEnabled,
	]);

	// ===========================================================
	// SIM UPDATE LOOP (every frame)
	// ===========================================================
	useFrame(() => {
		const dt = clockRef.current.getDelta() * config.speedMultiplier;

		// Update traffic lights (cars)
		lightsRef.current.update(dt * 1000);

		const NSphase = lightsRef.current.getNSPhase();
		const EWphase = lightsRef.current.getEWPhase();

		// Update pedestrian signals based on actual phases
		pedRef.current.update(dt * 1000, NSphase, EWphase);

		// Update world physics
		engine.update(dt, {
			NS: NSphase === "green",
			EW: EWphase === "green",
		});

		// Push render state to Component
		setState({
			entities: engine.getActiveEntities(),
			trafficLightPhases: {
				NS: NSphase,
				EW: EWphase,
				pedNS: pedRef.current.getNS(),
				pedEW: pedRef.current.getEW(),
				countdown: lightsRef.current.getCountdownSecRounded(),
			},
		});
	});

	return state;
}
