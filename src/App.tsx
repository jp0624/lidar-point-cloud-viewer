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
 const [webglSupported] = useState(()=>{try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }});
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
 flexShrink: 0,
 overflowY: "auto",
					backgroundColor: "#1f1f1f",
					color: "#fff",
				}}
			>
				<ConfigPanel config={config} onChange={handleConfigChange} />
			</div>

			<div style={{ flex: 1, minWidth: 0, position: "relative", height:"100vh" }}>
				{webglSupported ? <Canvas camera={{ position: [20, 30, 20], fov: 60 }}>
					<ambientLight intensity={0.4} />
					<directionalLight position={[20, 40, 20]} intensity={0.8} />

					{/* 🔥 Restore R3F OrbitControls */}
					<OrbitControls enableDamping dampingFactor={0.05} makeDefault />

					<IntersectionScene engine={engine} config={config} />
				</Canvas> : <div role="status" style={{padding:"3rem",color:"#e2edd9",height:"100%",display:"grid",placeContent:"center",background:"radial-gradient(circle at center,#263e31,#101b17)"}}><h1 style={{fontSize:"2rem"}}>LiDAR Traffic Simulation</h1><p>This 3D scene requires WebGL 2.</p><p>Open this app in a browser with hardware acceleration enabled.</p><p>The simulation controls are available in the sidebar.</p></div>}

				{config.lidarEnabled && <LidarLegend />}
			</div>
		</div>
	);
}

export default App;
