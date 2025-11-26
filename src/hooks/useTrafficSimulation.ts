import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { TrafficEngine } from "../simulation/TrafficEngine";
import type { Entity } from "../simulation/TrafficEngine";
import { TrafficLights } from "../simulation/TrafficLights";
import type { SimConfig } from "../types/SceneTypes";
import * as THREE from "three";

export interface SimulationState {
	entities: Entity[];
	trafficLightPhases: { NS: string; EW: string; countdown: number };
}

export function useTrafficSimulation(
	engine: TrafficEngine,
	config: SimConfig
): SimulationState {
	const [state, setState] = useState<SimulationState>({
		entities: [],
		trafficLightPhases: { NS: "green", EW: "red", countdown: 0 },
	});

	const clockRef = useRef(new THREE.Clock());
	const trafficLightsRef = useRef(new TrafficLights());

	// Initial population & density control
	useEffect(() => {
		const vehicleTypes = ["Car", "Truck"];
		const pedestrianTypes = ["Pedestrian", "Bicycle"];

		// FIX: engine.getMaxEntities() does NOT exist → use getPool().length
		const maxEntityCount = engine.getPool().length;
		const maxVehicleCount = Math.floor(maxEntityCount * 0.8);

		const targetVehicleCount = Math.ceil(
			config.trafficDensity * maxVehicleCount
		);

		// Reset and repopulate for new config
		engine.reset();

		// Spawn cars & trucks
		for (let i = 0; i < targetVehicleCount; i++) {
			const type =
				vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
			engine.spawn({ type: type as Entity["type"] });
		}

		// Spawn pedestrians
		if (config.pedestrianEnabled) {
			for (let i = 0; i < 5; i++) {
				engine.spawn({ type: "Pedestrian" });
			}
		}

		// Spawn bicycles
		if (config.bicycleEnabled) {
			for (let i = 0; i < 5; i++) {
				engine.spawn({ type: "Bicycle" });
			}
		}
	}, [
		engine,
		config.trafficDensity,
		config.pedestrianEnabled,
		config.bicycleEnabled,
	]);

	// Main simulation loop
	useFrame(() => {
		const delta = clockRef.current.getDelta() * config.speedMultiplier;

		// Update traffic lights
		trafficLightsRef.current.update(delta * 1000); // milliseconds

		const NS_GREEN = trafficLightsRef.current.getNSPhase() === "green";
		const EW_GREEN = trafficLightsRef.current.getEWPhase() === "green";

		// Update engine
		engine.update(delta, { NS: NS_GREEN, EW: EW_GREEN });

		// Push new state for rendering
		setState({
			entities: engine.getActiveEntities(),
			trafficLightPhases: {
				NS: trafficLightsRef.current.getNSPhase(),
				EW: trafficLightsRef.current.getEWPhase(),
				countdown: trafficLightsRef.current.getCountdownSecRounded(),
			},
		});
	});

	return state;
}
