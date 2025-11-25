import React, { useMemo, useRef } from "react";
import { Points, PointMaterial } from "@react-three/drei";
import type { Entity } from "../simulation/TrafficEngine"; // Type import is correct
import { computeLidarPoints } from "../simulation/utils";

interface LidarPointsProps {
	entities: Entity[];
	enabled: boolean;
}

export const LidarPoints: React.FC<LidarPointsProps> = ({
	entities,
	enabled,
}) => {
	const pointsRef = useRef(null);

	// Generate new point positions whenever entities change
	const positions = useMemo(() => {
		if (!enabled) return new Float32Array();
		// Compute Lidar points from the engine's current active entities
		// The ground plane is also an entity, but we only calculate points for moving objects
		const movingEntities = entities.filter(
			(e) => e.type !== "Road" && e.type !== "Sidewalk"
		);
		return computeLidarPoints(movingEntities);
	}, [enabled, entities]);

	if (!enabled) {
		return null;
	}

	return (
		<Points positions={positions} ref={pointsRef}>
			{/* Color: Red, Size: 0.05 (Smaller size for better detail) */}
			<PointMaterial
				transparent
				size={0.05}
				sizeAttenuation={true}
				depthWrite={false}
				color="#ff0000"
			/>
		</Points>
	);
};
