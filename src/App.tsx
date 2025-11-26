// src/App.tsx
import React, { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { IntersectionScene } from "./components/IntersectionScene";
import { ConfigPanel } from "./ui/ConfigPanel";
import { TrafficEngine } from "./simulation/TrafficEngine";
import type { SimConfig } from "./types/SceneTypes";
import { LidarLegend } from "./ui/LidarLegend";

const DEFAULT_CONFIG: SimConfig = {
	trafficDensity: 0.5,
	speedMultiplier: 1.0,
	pedestrianEnabled: true,
	bicycleEnabled: true,
	lidarEnabled: false,
};

export const App: React.FC = () => {
	const [config, setConfig] = useState<SimConfig>(DEFAULT_CONFIG);
	const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
		null
	);

	// Initialize engine once
	const engine = useMemo(() => new TrafficEngine(256), []);

	const handleConfigChange = (partial: Partial<SimConfig>) => {
		setConfig((prev) => ({ ...prev, ...partial }));
	};

	return (
		<div style={{ display: "flex", height: "100vh", width: "100vw" }}>
			{/* Left: Config panel */}
			<div
				style={{
					width: 280,
					backgroundColor: "#111827",
					color: "#fff",
					borderRight: "1px solid #1f2937",
				}}
			>
				<ConfigPanel
					config={config}
					onChange={handleConfigChange}
					selectedVehicleId={selectedVehicleId}
				/>
			</div>

			{/* Right: 3D Canvas */}
			<div style={{ flex: 1, position: "relative" }}>
				<Canvas camera={{ position: [20, 30, 20], fov: 60 }}>
					<OrbitControls enableDamping dampingFactor={0.08} />
					<IntersectionScene
						engine={engine}
						config={config}
						selectedVehicleId={selectedVehicleId}
						onSelectVehicle={setSelectedVehicleId}
					/>
				</Canvas>

				{config.lidarEnabled && (
					<div
						style={{
							position: "absolute",
							bottom: 16,
							left: 16,
						}}
					>
						<LidarLegend />
					</div>
				)}
			</div>
		</div>
	);
};
