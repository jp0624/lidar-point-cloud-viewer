import React, { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
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

	// Initialize engine once
	const engine = useMemo(() => new TrafficEngine(256), []);

	const handleConfigChange = (newConfig: Partial<SimConfig>) => {
		setConfig((prev) => ({ ...prev, ...newConfig }));
	};

	return (
		<div style={{ display: "flex", height: "100vh", width: "100vw" }}>
			{/* Left: Config panel */}
			<div
				style={{
					width: 280, // Slightly wider panel
					backgroundColor: "#1f1f1f",
					color: "#fff",
				}}
			>
				<ConfigPanel config={config} onChange={handleConfigChange} />
			</div>

			{/* Right: 3D Canvas */}
			<div style={{ flex: 1 }}>
				<Canvas camera={{ position: [20, 30, 20], fov: 60 }}>
					<ambientLight intensity={0.4} />
					<directionalLight position={[20, 40, 20]} intensity={0.8} />
					<IntersectionScene engine={engine} config={config} />
				</Canvas>
				{config.lidarEnabled && <LidarLegend />}
			</div>
		</div>
	);
};
