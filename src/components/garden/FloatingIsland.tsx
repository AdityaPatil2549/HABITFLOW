import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * A stylized low-poly floating island.
 * Uses a subdivided cylinder for the top cap with vertex displacement
 * to create an organic, faceted look without needing a noise library.
 */
export function FloatingIsland() {
  // Build displaced, low-poly island geometry procedurally
  const topGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(11, 9, 1.2, 14, 6, false);
    const pos = geo.attributes.position as THREE.BufferAttribute;

    // Displace vertices to create organic lumps
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      // Only displace top face (y > 0)
      if (y > 0) {
        const bump =
          Math.sin(x * 0.9) * 0.35 +
          Math.cos(z * 0.8) * 0.3 +
          Math.sin(x * 0.4 + z * 0.5) * 0.5;
        const edgeFalloff = 1 - Math.min(dist / 11, 1);
        pos.setY(i, y + bump * edgeFalloff);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Bottom tapered rock underside
  const bottomGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(9, 3, 3.5, 10, 4, false);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Jagged rock underside
      const jag = (Math.sin(x * 1.5) + Math.cos(z * 1.3)) * 0.4;
      pos.setY(i, pos.getY(i) + jag);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group position={[0, -0.6, 0]}>
      {/* Main grassy top */}
      <mesh geometry={topGeometry} receiveShadow castShadow>
        <meshStandardMaterial
          color="#3a6b27"
          roughness={0.85}
          metalness={0.0}
          flatShading
        />
      </mesh>
      {/* Earthy/rocky underside */}
      <mesh geometry={bottomGeometry} position={[0, -1.5, 0]} castShadow>
        <meshStandardMaterial
          color="#5c4033"
          roughness={0.95}
          flatShading
        />
      </mesh>
      {/* Small pebbles/decoration rings */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const angle = (i / 6) * Math.PI * 2;
        const r = 8 + Math.sin(i * 1.7) * 1.5;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, 0.3 + Math.sin(i * 0.9) * 0.3, Math.sin(angle) * r]}
            castShadow
          >
            <sphereGeometry args={[0.25 + Math.random() * 0.2, 5, 4]} />
            <meshStandardMaterial color="#4a3728" roughness={0.9} flatShading />
          </mesh>
        );
      })}
      {/* Small glowing mushrooms */}
      {[0, 1, 2].map(i => {
        const angle = (i / 3) * Math.PI * 2 + 0.5;
        const r = 5 + i * 1.2;
        return (
          <group
            key={i}
            position={[Math.cos(angle) * r, 0.5, Math.sin(angle) * r]}
          >
            <mesh castShadow>
              <cylinderGeometry args={[0.05, 0.08, 0.4, 6]} />
              <meshStandardMaterial color="#e8d5b7" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <sphereGeometry args={[0.18, 7, 5]} />
              <meshStandardMaterial
                color={['#ff6b6b', '#a78bfa', '#34d399'][i]}
                emissive={['#ff6b6b', '#a78bfa', '#34d399'][i]}
                emissiveIntensity={0.8}
                roughness={0.5}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
