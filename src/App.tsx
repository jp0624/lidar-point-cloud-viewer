// src/App.tsx
import { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei"; // ⬅ add this
import { IntersectionScene } from "./components/IntersectionScene";
import { ConfigPanel } from "./ui/ConfigPanel";
import { TrafficEngine } from "./simulation/TrafficEngine";
import type { SimConfig } from "./types/SceneTypes";
import { LidarLegend } from "./ui/LidarLegend";
import "./App.css";

const DEFAULT_CONFIG: SimConfig = {
	trafficDensity: 0.5,
	carRatio: 0.4,
	truckRatio: 0.1,
	bikeRatio: 0.3,
	pedRatio: 0.2,
	speedMultiplier: 1.0,
	lidarEnabled: false,
	forceLightPhase: "auto",
};

function App() {
	const [config, setConfig] = useState<SimConfig>(DEFAULT_CONFIG);
	const engine = useMemo(() => new TrafficEngine(256), []);

	const handleConfigChange = (partial: Partial<SimConfig>) => {
		setConfig((prev) => ({ ...prev, ...partial }));
	};

	return (
		<div style={{ display: "flex", height: "100vh", width: "100vw" }}>
			<div
				style={{
					width: 280,
					backgroundColor: "#1f1f1f",
					color: "#fff",
				}}
			>
				<ConfigPanel config={config} onChange={handleConfigChange} />
			</div>

			<div style={{ flex: 1, position: "relative" }}>
				<Canvas camera={{ position: [20, 30, 20], fov: 60 }}>
					<ambientLight intensity={0.4} />
					<directionalLight position={[20, 40, 20]} intensity={0.8} />

					{/* 🔥 Restore R3F OrbitControls */}
					<OrbitControls enableDamping dampingFactor={0.05} makeDefault />

					<IntersectionScene engine={engine} config={config} />
				</Canvas>

				{config.lidarEnabled && <LidarLegend />}
			</div>
		</div>
	);
}

export default App;
