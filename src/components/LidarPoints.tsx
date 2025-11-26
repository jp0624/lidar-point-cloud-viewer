// src/components/LidarPoints.tsx
import React, { useMemo, useRef } from "react";
import { Points, PointMaterial } from "@react-three/drei";
import type { Entity } from "../simulation/TrafficEngine";
import { computeLidarPoints } from "../simulation/utils";

interface LidarPointsProps {
	entities: Entity[];
	enabled: boolean;
}

export const LidarPoints: React.FC<LidarPointsProps> = ({
	entities,
	enabled,
}) => {
	const pointsRef = useRef<THREE.Points>(null);

	const positions = useMemo(() => {
		if (!enabled) return new Float32Array();
		const moving = entities.filter((e) => e.type !== "Pedestrian" || e.active);
		return computeLidarPoints(moving);
	}, [enabled, entities]);

	if (!enabled) return null;

	return (
		<Points ref={pointsRef} positions={positions}>
			<PointMaterial
				transparent
				size={0.05}
				sizeAttenuation
				depthWrite={false}
				color="#ff0000"
			/>
		</Points>
	);
};
