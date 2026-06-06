import { useRef, useState, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { HabitWithStreak } from '../../types';

// ── Sparkle burst on select ────────────────────────────────────────────
const SPARK_COUNT = 20;
function SparkBurst({
  active,
  color,
}: {
  active: boolean;
  color: string;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const sparks = useMemo(
    () =>
      Array.from({ length: SPARK_COUNT }, () => ({
        dir: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 1.5 + 0.5,
          (Math.random() - 0.5) * 2
        ).normalize(),
        speed: 1.5 + Math.random() * 2,
      })),
    []
  );

  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (active && startTime.current === null) {
      startTime.current = clock.elapsedTime;
    }
    if (!active) {
      startTime.current = null;
      // Hide all sparks
      sparks.forEach((_, i) => {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        ref.current!.setMatrixAt(i, dummy.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
      return;
    }

    const elapsed = clock.elapsedTime - (startTime.current ?? clock.elapsedTime);
    const lifetime = 0.8;
    const t = Math.min(elapsed / lifetime, 1);

    sparks.forEach((s, i) => {
      const dist = s.speed * t;
      dummy.position.set(
        s.dir.x * dist,
        s.dir.y * dist - 0.5 * t * t * 9.8, // gravity
        s.dir.z * dist
      );
      const scale = t < 1 ? (1 - t) * 0.12 : 0;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, SPARK_COUNT]}>
      <sphereGeometry args={[1, 4, 3]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3}
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ── Branch cluster (unchanged helper) ─────────────────────────────────
function BranchCluster({
  position,
  color,
  radius,
  hovered,
  selected,
}: {
  position: [number, number, number];
  color: string;
  radius: number;
  hovered: boolean;
  selected: boolean;
}) {
  const offsets: [number, number, number][] = useMemo(
    () =>
      [
        [0, 0, 0],
        [radius * 0.5, -radius * 0.3, radius * 0.2],
        [-radius * 0.4, -radius * 0.2, -radius * 0.3],
        [radius * 0.2, -radius * 0.5, -radius * 0.4],
        [-radius * 0.3, -radius * 0.4, radius * 0.5],
      ] as [number, number, number][],
    [radius]
  );

  return (
    <group position={position}>
      {offsets.map((off, i) => (
        <mesh key={i} position={off} castShadow>
          <sphereGeometry args={[radius * (0.7 + i * 0.06), 5, 4]} />
          <meshStandardMaterial
            color={color}
            roughness={0.6}
            emissive={color}
            emissiveIntensity={selected ? 0.8 : hovered ? 0.5 : 0.15}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

function Trunk({
  height,
  baseRadius,
  topRadius,
  color,
}: {
  height: number;
  baseRadius: number;
  topRadius: number;
  color: string;
}) {
  return (
    <mesh position={[0, height / 2, 0]} castShadow>
      <cylinderGeometry args={[topRadius, baseRadius, height, 7]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
    </mesh>
  );
}

function Seed({
  color,
  hovered,
  selected,
}: {
  color: string;
  hovered: boolean;
  selected: boolean;
}) {
  return (
    <group>
      <mesh receiveShadow>
        <sphereGeometry args={[0.35, 8, 6]} />
        <meshStandardMaterial color="#3f2e1e" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 3 : hovered ? 2.5 : 1.5}
          roughness={0.3}
        />
      </mesh>
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * 0.12, 0.5, 0]} rotation={[0, 0, side * 0.5]}>
          <coneGeometry args={[0.1, 0.25, 4]} />
          <meshStandardMaterial color="#4ade80" roughness={0.7} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Sapling({
  color,
  hovered,
  selected,
}: {
  color: string;
  hovered: boolean;
  selected: boolean;
}) {
  return (
    <group>
      <Trunk height={1.2} baseRadius={0.1} topRadius={0.07} color="#7c5c3a" />
      <Float speed={2} floatIntensity={0.15}>
        <BranchCluster
          position={[0, 1.4, 0]}
          color={color}
          radius={0.4}
          hovered={hovered}
          selected={selected}
        />
      </Float>
      <mesh position={[0.2, 0.7, 0]} rotation={[0, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 0.45, 5]} />
        <meshStandardMaterial color="#7c5c3a" roughness={0.95} flatShading />
      </mesh>
      <BranchCluster
        position={[0.38, 0.9, 0.1]}
        color={color}
        radius={0.22}
        hovered={hovered}
        selected={selected}
      />
    </group>
  );
}

function SmallTree({
  color,
  hovered,
  selected,
}: {
  color: string;
  hovered: boolean;
  selected: boolean;
}) {
  return (
    <group>
      <Trunk height={2.2} baseRadius={0.18} topRadius={0.1} color="#6b4c2a" />
      {[-1, 1].map(side => (
        <group key={side}>
          <mesh
            position={[side * 0.22, 1.2, 0.1 * side]}
            rotation={[0, 0, side * -0.7]}
            castShadow
          >
            <cylinderGeometry args={[0.04, 0.08, 0.7, 5]} />
            <meshStandardMaterial color="#6b4c2a" roughness={0.95} flatShading />
          </mesh>
          <Float speed={1.5} floatIntensity={0.1}>
            <BranchCluster
              position={[side * 0.5, 1.55, 0.15 * side]}
              color={color}
              radius={0.35}
              hovered={hovered}
              selected={selected}
            />
          </Float>
        </group>
      ))}
      <Float speed={2} floatIntensity={0.2}>
        <BranchCluster
          position={[0, 2.5, 0]}
          color={color}
          radius={0.7}
          hovered={hovered}
          selected={selected}
        />
      </Float>
    </group>
  );
}

function BigTree({
  color,
  hovered,
  selected,
}: {
  color: string;
  hovered: boolean;
  selected: boolean;
}) {
  return (
    <group>
      <Trunk height={3.6} baseRadius={0.3} topRadius={0.15} color="#5a3e25" />
      {([0, 1, 2, 3] as const).map(i => {
        const side = i % 2 === 0 ? 1 : -1;
        const angle = (i / 4) * Math.PI * 2;
        const bh = 1.6 + i * 0.55;
        return (
          <group key={i}>
            <mesh
              position={[Math.cos(angle) * 0.28, bh, Math.sin(angle) * 0.28]}
              rotation={[Math.sin(angle) * 0.6, angle, side * -0.55]}
              castShadow
            >
              <cylinderGeometry args={[0.05, 0.1, 0.9, 5]} />
              <meshStandardMaterial color="#5a3e25" roughness={0.9} flatShading />
            </mesh>
            <Float speed={1.2 + i * 0.3} floatIntensity={0.12}>
              <BranchCluster
                position={[Math.cos(angle) * 0.75, bh + 0.35, Math.sin(angle) * 0.75]}
                color={color}
                radius={0.5}
                hovered={hovered}
                selected={selected}
              />
            </Float>
          </group>
        );
      })}
      <Float speed={1.8} floatIntensity={0.25}>
        <mesh position={[0, 4.2, 0]} castShadow>
          <icosahedronGeometry args={[1.3, 1]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={selected ? 1.2 : hovered ? 0.8 : 0.35}
            roughness={0.55}
            flatShading
          />
        </mesh>
        {[0, 1, 2].map(i => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.9, 3.8, Math.sin(a) * 0.9]} castShadow>
              <icosahedronGeometry args={[0.65, 0]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={selected ? 1.0 : hovered ? 0.6 : 0.2}
                roughness={0.6}
                flatShading
              />
            </mesh>
          );
        })}
      </Float>
    </group>
  );
}

function WitheredPlant({ height }: { height: number }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.06, 0.1, height, 6]} />
        <meshStandardMaterial color="#6b7280" roughness={0.9} flatShading />
      </mesh>
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * 0.15, height * 0.8, 0]} rotation={[0, 0, side * 1.2]}>
          <coneGeometry args={[0.18, 0.5, 4]} />
          <meshStandardMaterial color="#4b5563" roughness={0.8} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ── Main export ────────────────────────────────────────────────────────
export function HabitPlant({
  habit,
  position,
  selected,
  onSelect,
}: {
  habit: HabitWithStreak;
  position: [number, number, number];
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [sparkActive, setSparkActive] = useState(false);

  const streak = habit.streak?.current ?? 0;
  const rawColor = habit.color || '#10b981';
  const isMissed = !habit.todayLog && streak === 0 && !!habit.createdAt;

  let labelY: number;
  let plant: React.ReactNode;

  if (isMissed) {
    labelY = 2.5;
    plant = <WitheredPlant height={1.4} />;
  } else if (streak === 0) {
    labelY = 1.2;
    plant = <Seed color={rawColor} hovered={hovered} selected={selected} />;
  } else if (streak < 3) {
    labelY = 2.0;
    plant = <Sapling color={rawColor} hovered={hovered} selected={selected} />;
  } else if (streak < 10) {
    labelY = 3.2;
    plant = <SmallTree color={rawColor} hovered={hovered} selected={selected} />;
  } else {
    labelY = 5.4;
    plant = <BigTree color={rawColor} hovered={hovered} selected={selected} />;
  }

  const handleClick = useCallback(() => {
    onSelect(habit.id);
    setSparkActive(true);
    setTimeout(() => setSparkActive(false), 900);
  }, [habit.id, onSelect]);

  useFrame(state => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    if (!isMissed) {
      group.current.rotation.x =
        Math.sin(t * 1.8 + position[0]) * (hovered || selected ? 0.02 : 0.04);
      group.current.rotation.z =
        Math.cos(t * 1.4 + position[2]) * (hovered || selected ? 0.02 : 0.04);
    }
    // Float up when hovered or selected
    const targetY = selected ? 0.35 : hovered ? 0.25 : 0;
    group.current.position.y += (targetY - group.current.position.y) * 0.08;

    // Selected ring pulse
    if (selected && group.current.children.length > 0) {
      const ring = group.current.getObjectByName('selectRing');
      if (ring) {
        ring.rotation.y = t * 1.2;
        ring.rotation.z = Math.sin(t * 0.8) * 0.3;
      }
    }
  });

  const stageName =
    isMissed
      ? 'Withered'
      : streak === 0
        ? 'Seed 🌱'
        : streak < 3
          ? 'Sapling 🌿'
          : streak < 10
            ? 'Young Tree 🌳'
            : 'Ancient Tree 🌲';

  return (
    <group
      ref={group}
      position={position}
      onClick={handleClick}
      onPointerOver={e => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Selection ring */}
      {selected && (
        <mesh name="selectRing" position={[0, 0.1, 0]}>
          <torusGeometry args={[0.9, 0.04, 8, 32]} />
          <meshStandardMaterial
            color={rawColor}
            emissive={rawColor}
            emissiveIntensity={1.5}
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Soil mound */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[0.55, 0.65, 0.25, 10]} />
        <meshStandardMaterial color="#3f2e1e" roughness={1} flatShading />
      </mesh>

      {plant}

      {/* Sparkle burst on click */}
      <SparkBurst active={sparkActive} color={rawColor} />

      {/* Label */}
      <Html
        position={[0, labelY, 0]}
        center
        distanceFactor={14}
        occlude={false}
        zIndexRange={[0, 100]}
      >
        <div
          style={{
            background:
              selected
                ? 'rgba(10, 12, 22, 0.95)'
                : hovered
                  ? 'rgba(15, 15, 20, 0.92)'
                  : 'rgba(15, 15, 20, 0.75)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${selected ? rawColor + 'cc' : hovered ? rawColor + '88' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: '14px',
            padding: '7px 12px',
            textAlign: 'center',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: selected
              ? `0 0 24px ${rawColor}77, 0 0 8px ${rawColor}44`
              : hovered
                ? `0 0 18px ${rawColor}55`
                : 'none',
            transform: selected ? 'scale(1.12)' : hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 0.25s ease',
          }}
        >
          <div
            style={{
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: 'center',
              fontFamily: 'Outfit, Inter, sans-serif',
            }}
          >
            <span>{habit.icon}</span>
            <span>{habit.name}</span>
          </div>
          <div
            style={{
              color: isMissed ? '#9ca3af' : '#fbbf24',
              fontWeight: 800,
              fontSize: '11px',
              marginTop: '3px',
              fontFamily: 'Outfit, Inter, sans-serif',
            }}
          >
            {isMissed ? '— missed —' : `${streak}d · ${stageName}`}
          </div>
          {selected && (
            <div
              style={{
                color: rawColor,
                fontWeight: 600,
                fontSize: '10px',
                marginTop: '3px',
                opacity: 0.85,
              }}
            >
              tap panel to log ›
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
