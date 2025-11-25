import React, { useMemo } from "react";
import * as THREE from "three";
import type { Entity } from "../simulation/TrafficEngine"; // FIX: Added 'type' for type-only import

interface VehicleProps {
	entity: Entity;
}

// Color map for visualization consistency
const colorMap: Record<number, string> = {
	0: "#ff5555", // Red (Default Car)
	1: "#55ff55", // Green (e.g., Pedestrian)
	2: "#5555ff", // Blue
	3: "#ffff55", // Yellow (e.g., Truck)
	4: "#ff55ff", // Magenta (e.g., Bicycle)
};

export const Vehicle: React.FC<VehicleProps> = ({ entity }) => {
	const [x, y, z] = entity.position;
	const [dx, dy, dz] = entity.dir;
	const [sx, sy, sz] = entity.scale;

	// Calculate rotation based on direction vector (atan2 for 2D plane)
	const rotationY = Math.atan2(dx, dz);

	const meshColor = useMemo(() => {
		if (entity.type === "Bicycle") return 0x00ff00;
		if (entity.type === "Pedestrian") return 0xffff00;
		return new THREE.Color(colorMap[entity.color] || colorMap[0]).getHex();
	}, [entity.type, entity.color]);

	return (
		<group position={[x, y, z]} rotation={[0, rotationY, 0]}>
			<mesh position={[0, sy / 2, 0]}>
				<boxGeometry args={[sx * 10, sy * 10, sz * 10]} />
				<meshStandardMaterial color={meshColor} />
			</mesh>
		</group>
	);
};
