import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface Avatar3DModelProps {
  onBagThrow: () => void;
}

function Avatar3DModel({ onBagThrow }: Avatar3DModelProps) {
  const avatarRef = useRef<THREE.Group>(null);
  const bagRef = useRef<THREE.Mesh>(null);
  const [isThrowingBag, setIsThrowingBag] = useState(false);
  const [bagPosition, setBagPosition] = useState(new THREE.Vector3(0.5, 0.5, 0));

  useFrame((state) => {
    if (avatarRef.current && !isThrowingBag) {
      // Idle animation - slight bob
      avatarRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      avatarRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }

    if (bagRef.current && isThrowingBag) {
      // Bag throw animation
      const elapsed = state.clock.elapsedTime;
      bagPosition.x += 0.1;
      bagPosition.y = Math.sin(elapsed * 5) * 2 - 1;
      bagPosition.z += 0.05;
      
      bagRef.current.position.copy(bagPosition);
      bagRef.current.rotation.x += 0.2;
      bagRef.current.rotation.y += 0.15;

      // Reset and trigger auth when bag is far enough
      if (bagPosition.x > 5) {
        setIsThrowingBag(false);
        setBagPosition(new THREE.Vector3(0.5, 0.5, 0));
        onBagThrow();
      }
    }
  });

  const throwBag = () => {
    if (!isThrowingBag) {
      setIsThrowingBag(true);
      setBagPosition(new THREE.Vector3(0.5, 0.5, 0));
    }
  };

  return (
    <group>
      {/* Avatar */}
      <group ref={avatarRef} onClick={throwBag}>
        {/* Head */}
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#ffdbac" />
        </mesh>
        
        {/* Eyes */}
        <mesh position={[-0.1, 1.65, 0.25]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        <mesh position={[0.1, 1.65, 0.25]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#000" />
        </mesh>

        {/* Body */}
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 1, 32]} />
          <meshStandardMaterial color="#4f46e5" />
        </mesh>

        {/* Arms */}
        <mesh position={[-0.4, 0.8, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.08, 0.08, 0.8, 16]} />
          <meshStandardMaterial color="#ffdbac" />
        </mesh>
        <mesh position={[0.4, 0.8, 0]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.08, 0.08, 0.8, 16]} />
          <meshStandardMaterial color="#ffdbac" />
        </mesh>

        {/* Legs */}
        <mesh position={[-0.15, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.6, 16]} />
          <meshStandardMaterial color="#2d2d2d" />
        </mesh>
        <mesh position={[0.15, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.6, 16]} />
          <meshStandardMaterial color="#2d2d2d" />
        </mesh>
      </group>

      {/* Bag */}
      {!isThrowingBag ? (
        <mesh ref={bagRef} position={[0.5, 0.5, 0]}>
          <boxGeometry args={[0.3, 0.4, 0.2]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
      ) : (
        <mesh ref={bagRef}>
          <boxGeometry args={[0.3, 0.4, 0.2]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
      )}

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#90EE90" />
      </mesh>
    </group>
  );
}

interface Avatar3DProps {
  onBagThrow: () => void;
}

export default function Avatar3D({ onBagThrow }: Avatar3DProps) {
  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden bg-gradient-to-b from-sky-200 to-sky-100">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[3, 2, 5]} />
        <OrbitControls enableZoom={false} enablePan={false} />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />
        
        <Avatar3DModel onBagThrow={onBagThrow} />
      </Canvas>
      <div className="text-center mt-2 text-sm text-muted-foreground">
        Click the avatar to throw the bag and access authentication
      </div>
    </div>
  );
}
