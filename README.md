# 📡 LIDAR Intersection Simulation

A real-time 3D traffic intersection simulator featuring vehicles, pedestrians, bicycles, synchronized traffic lights, bike lanes, sidewalks, and live LIDAR point-cloud rendering.  
Built using **React**, **Three.js**, and **@react-three/fiber**, this system visualizes an urban intersection in motion while generating simulated LIDAR point data in real time.

---

## 🚀 Features

### 🔦 Real-Time LIDAR Point Cloud

- Generates LIDAR points from live scene entities (cars, trucks, bikes, pedestrians).
- Points update every frame based on object movement and orientation.
- Toggle LIDAR on/off using the built-in UI panel.

### 🚗 Complete Traffic Simulation

- Multi-lane intersection with 4 travel directions:
  - **NS, SN, WE, EW**
- Vehicles include:
  - **Cars**
  - **Trucks**
  - **Bicycles** (ride inside green bike lanes)
  - **Pedestrians** (walk on sidewalks)
- Vehicles are spaced to prevent collisions and maintain realistic flow.

### 🚦 Fully Functional Traffic Lights

- Automatic cycle per axis:
  - **Green: 8 seconds**
  - **Yellow: 2 seconds**
  - While one axis is green or yellow, the opposing axis remains red.
- Vehicles stop before entering the intersection on red.

### 🛣️ Environment Rendering

- Paved roads, sidewalks, bike lanes, and a full intersection ground plane.
- Daylight scene lighting (hemisphere + directional).
- Camera orbit controls (pan/zoom/rotate).

### 🧰 Dynamic Scene Editing

- Add or remove traffic entities instantly.
- Control panel includes:
  - Traffic animation toggle
  - LIDAR toggle
  - Vehicle spawn buttons
  - Speed slider
  - Light cycle indicator/countdown

---

## 📘 Technical Overview

The simulation architecture is built around a few core systems:

### 1. TrafficEngine

A deterministic traffic controller that manages all entities:

- Maintains entity pool (cars, trucks, bikes, pedestrians)
- Handles:
  - Path following
  - Intersection stopping logic
  - Auto-respawning / deactivation
  - Minimum spacing between entities
  - Orientation / direction vectors

Each moving object has:

```ts
export interface Entity {
	id: string;
	type: EntityType;
	position: [number, number, number];
	dir: [number, number, number];
	speed: number;
	active: boolean;
	pathId: number;
	progress: number;
	scale: [number, number, number];
	color: number;
}
```

Paths are defined as straight lines through the intersection (NS, SN, WE, EW).

### 2. LIDAR Simulation

The `useLidarSimulation()` hook converts all active entities into synthetic point cloud data:

- Points are sampled randomly inside object bounding boxes.
- A fixed budget of points is distributed across entities based on type.
- Output is a `Float32Array` representing XYZ triplets.
- Rendered using a Three.js `Points` object.

### 3. Intersection Scene Renderer

`IntersectionScene.tsx` creates the 3D environment:

- Roads, sidewalks, and green bike lanes
- Traffic lights standing at the corners of the intersection
- Entities as Three.js meshes (scaled and rotated)
- Real-time animation loop using `requestAnimationFrame`
- OrbitControls camera for intuitive navigation

It also:

- Applies vehicle orientation based on direction vectors
- Adds LIDAR point cloud when enabled
- Updates lights based on the timer
- Applies light logic to `TrafficEngine` flow

### 4. UI Control Panel

The `ConfigPanel.tsx` integrates with React state to expose:

- LIDAR toggle
- Animation toggle
- Speed slider
- Spawn vehicle buttons (Car / Truck / Bicycle / Pedestrian)
- Traffic light indicators / countdown

---

## 🕹️ How to Use

### Controls

| Feature                      | Description                                         |
| ---------------------------- | --------------------------------------------------- |
| **Animate Traffic**          | Start/stop all movement.                            |
| **LIDAR Toggle**             | Show/hide live LIDAR point cloud.                   |
| **Spawn Car/Truck/Bike/Ped** | Add objects to the scene.                           |
| **Speed Slider**             | Speed up or slow down entire simulation.            |
| **Light Cycle Indicator**    | Shows which axis currently has green/yellow vs red. |

### Camera Controls

- **Left mouse drag:** Rotate
- **Right mouse drag:** Pan
- **Scroll:** Zoom

---

## 📦 Installation & Running

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open the app in your browser (default Vite port is `http://localhost:5173`).

---

## 📁 Project Structure

```text
src/
├─ components/
│  ├─ IntersectionScene.tsx
│  ├─ ConfigPanel.tsx
├─ hooks/
│  ├─ useLidarSimulation.ts
├─ simulation/
│  ├─ TrafficEngine.ts
│  ├─ lidar.ts
│  ├─ SceneManager.tsx
├─ App.tsx
├─ main.tsx
├─ styles/
│  └─ main.css
```

---

## 📷 Visualization Preview

- Vehicles move realistically through a 4-lane intersection in all directions.
- Lights cycle automatically and control flow across NS/SN vs WE/EW.
- LIDAR points shimmer across objects as they move.
- Pedestrians walk sidewalks; bicycles remain in clearly marked bike lanes.

---

## 🧭 Future Enhancements (Optional)

- Vehicle turning logic (left/right turns at the intersection)
- Multiple interconnected intersections
- Variable LIDAR noise profiles and range limits
- Object segmentation / semantic labeling
- Sensor frustum visualization
- Export / recording of point clouds to file

---

## 📄 License

MIT License — free for personal or commercial use.
