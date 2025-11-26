// src/hooks/useTrafficSimulation.ts
import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import type { TrafficEngine, Entity } from "../simulation/TrafficEngine";
import { TrafficLights } from "../simulation/TrafficLights";
import type { SimConfig } from "../types/SceneTypes";
import * as THREE from "three";

export interface SimulationState {
	entities: Entity[];
	trafficLightPhases: {
		NS: { straight: string; left: string; right: string };
		EW: { straight: string; left: string; right: string };
		ped: { acrossNS: "walk" | "stop"; acrossEW: "walk" | "stop" };
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
			NS: { straight: "red", left: "red", right: "red" },
			EW: { straight: "red", left: "red", right: "red" },
			ped: { acrossNS: "stop", acrossEW: "stop" },
			countdown: 0,
		},
	});

	const clockRef = useRef(new THREE.Clock());
	const lightsRef = useRef(new TrafficLights());

	// Repopulate when config changes
	useEffect(() => {
		engine.reset();

		const maxCount = engine.getMaxEntities();
		const vehicleCount = Math.floor(maxCount * config.trafficDensity);

		// cars + trucks
		for (let i = 0; i < vehicleCount; i++) {
			const types: Entity["type"][] = ["Car", "Truck"];
			const t = types[Math.floor(Math.random() * types.length)];
			engine.spawn({ type: t });
		}

		// pedestrians
		if (config.pedestrianEnabled) {
			for (let i = 0; i < 8; i++) {
				engine.spawn({ type: "Pedestrian" });
			}
		}

		// bicycles
		if (config.bicycleEnabled) {
			for (let i = 0; i < 6; i++) {
				engine.spawn({ type: "Bicycle" });
			}
		}
	}, [
		engine,
		config.trafficDensity,
		config.pedestrianEnabled,
		config.bicycleEnabled,
	]);

	useFrame(() => {
		const dt = clockRef.current.getDelta() * config.speedMultiplier;

		// Update light logic (ms)
		lightsRef.current.update(dt * 1000);

		const phases = lightsRef.current.getPhases();

		// Feed simplified boolean to engine (straight movement)
		engine.update(dt, {
			NS: phases.NS.straight === "green",
			EW: phases.EW.straight === "green",
		});

		setState({
			entities: engine.getActiveEntities(),
			trafficLightPhases: {
				...phases,
				countdown: lightsRef.current.getCountdownSecRounded(),
			},
		});
	});

	return state;
}
