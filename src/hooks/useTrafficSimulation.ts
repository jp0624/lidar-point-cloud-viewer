// src/hooks/useTrafficSimulation.ts

import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { TrafficEngine } from "../simulation/TrafficEngine";
import type { Entity } from "../simulation/TrafficEngine";
import { TrafficLights } from "../simulation/TrafficLights";
import type { SimConfig } from "../types/SceneTypes";
import * as THREE from "three";
import type {
	PhaseColor,
	ArrowPhase,
	PedPhase,
} from "../simulation/TrafficLights";

export interface SimulationState {
	entities: Entity[];
	trafficLightPhases: {
		NS: PhaseColor;
		EW: PhaseColor;
		countdown: number;

		// New: arrow and pedestrian phases (optional for backward compatibility)
		NSLeft?: ArrowPhase;
		EWLeft?: ArrowPhase;
		pedNS?: PedPhase;
		pedEW?: PedPhase;
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
			countdown: 0,
			NSLeft: "off",
			EWLeft: "off",
			pedNS: "hand",
			pedEW: "hand",
		},
	});

	const clockRef = useRef(new THREE.Clock());
	const trafficLightsRef = useRef(new TrafficLights());

	// Re-populate when density sliders change
	useEffect(() => {
		engine.reset();

		const max = engine.getMaxEntities();
		const targetTotal = Math.max(4, Math.floor(max * config.trafficDensity));

		// Normalize ratios
		const sumRatios =
			config.carRatio +
				config.truckRatio +
				config.bikeRatio +
				config.pedRatio || 1;

		const normCar = config.carRatio / sumRatios;
		const normTruck = config.truckRatio / sumRatios;
		const normBike = config.bikeRatio / sumRatios;
		const normPed = config.pedRatio / sumRatios;

		const counts = {
			car: Math.floor(targetTotal * normCar),
			truck: Math.floor(targetTotal * normTruck),
			bike: Math.floor(targetTotal * normBike),
			ped: Math.floor(targetTotal * normPed),
		};

		for (let i = 0; i < counts.car; i++) engine.spawn({ type: "Car" });
		for (let i = 0; i < counts.truck; i++) engine.spawn({ type: "Truck" });
		for (let i = 0; i < counts.bike; i++) engine.spawn({ type: "Bicycle" });
		for (let i = 0; i < counts.ped; i++) engine.spawn({ type: "Pedestrian" });
	}, [
		engine,
		config.trafficDensity,
		config.carRatio,
		config.truckRatio,
		config.bikeRatio,
		config.pedRatio,
	]);

	useFrame(() => {
		const delta = clockRef.current.getDelta() * config.speedMultiplier;

		// 1) Update traffic lights with deltaMs
		trafficLightsRef.current.update(delta * 1000);

		let nsPhase = trafficLightsRef.current.getNSPhase();
		let ewPhase = trafficLightsRef.current.getEWPhase();

		// Optional force for debugging
		if (config.forceLightPhase !== "auto") {
			nsPhase = config.forceLightPhase;
			ewPhase = config.forceLightPhase;
		}

		const NS_GREEN = nsPhase === "green";
		const EW_GREEN = ewPhase === "green";

		// 2) Update traffic engine with MAIN ball heads only
		engine.update(delta, { NS: NS_GREEN, EW: EW_GREEN });

		// 3) Publish full phase state to scene
		setState({
			entities: engine.getActiveEntities(),
			trafficLightPhases: {
				NS: nsPhase,
				EW: ewPhase,
				countdown: trafficLightsRef.current.getCountdownSecRounded(),
				NSLeft: trafficLightsRef.current.getNSLeftPhase(),
				EWLeft: trafficLightsRef.current.getEWLeftPhase(),
				pedNS: trafficLightsRef.current.getPedNSPhase(),
				pedEW: trafficLightsRef.current.getPedEWPhase(),
			},
		});
	});

	return state;
}
