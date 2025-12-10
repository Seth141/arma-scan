'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

interface StlViewerModalProps {
  isOpen: boolean
  onClose: () => void
  stlUrl: string | null
  downloadName?: string
}

export default function StlViewerModal({ isOpen, onClose, stlUrl, downloadName = 'model.stl' }: StlViewerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)

  // Initialize Three.js when modal opens
  useEffect(() => {
    if (!isOpen) return
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = null
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0, 120)
    cameraRef.current = camera

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
    keyLight.position.set(1, 1, 1)
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
    fillLight.position.set(-1, -0.5, -1)
    scene.add(fillLight)
    const hemiLight = new THREE.HemisphereLight(0x4f46e5, 0x0b0f19, 0.25)
    scene.add(hemiLight)

    // Grid and axis helpers (subtle)
    const grid = new THREE.GridHelper(200, 20, 0x333333, 0x222222)
    grid.position.y = -50
    grid.material.opacity = 0.15
    ;(grid.material as THREE.Material).transparent = true
    scene.add(grid)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = false
    controls.minDistance = 30
    controls.maxDistance = 400
    controls.target.set(0, 0, 0)
    controls.update()
    controlsRef.current = controls

    let animationFrameId: number
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
      // Clean up scene
      if (meshRef.current) {
        meshRef.current.geometry.dispose()
        ;(meshRef.current.material as THREE.Material).dispose()
        meshRef.current = null
      }
      scene.clear()
      sceneRef.current = null
      cameraRef.current = null
      rendererRef.current = null
      controlsRef.current = null
    }
  }, [isOpen])

  // Load STL when URL changes
  useEffect(() => {
    if (!isOpen) return
    if (!stlUrl) return
    if (!sceneRef.current) return

    const loader = new STLLoader()
    loader.load(
      stlUrl,
      geometry => {
        // Remove previous mesh if any
        if (meshRef.current) {
          sceneRef.current!.remove(meshRef.current)
          meshRef.current.geometry.dispose()
          ;(meshRef.current.material as THREE.Material).dispose()
          meshRef.current = null
        }

        // Center and scale geometry to a reasonable size
        geometry.computeBoundingBox()
        geometry.computeBoundingSphere()
        const bbox = geometry.boundingBox!
        const size = new THREE.Vector3()
        bbox.getSize(size)
        const maxDim = Math.max(size.x, size.y, size.z)
        const targetSize = 120
        const scale = maxDim > 0 ? targetSize / maxDim : 1

        const material = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.35, roughness: 0.25 })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.scale.setScalar(scale)

        // Re-center to origin
        const center = new THREE.Vector3()
        bbox.getCenter(center)
        mesh.position.sub(center.multiplyScalar(scale))

        sceneRef.current!.add(mesh)
        meshRef.current = mesh
      },
      undefined,
      error => {
        console.error('Failed to load STL:', error)
      }
    )
  }, [isOpen, stlUrl])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:w-[92vw] max-w-full sm:max-w-5xl h-[75vh] sm:h-[72vh] bg-gradient-to-b from-gray-900/95 to-black/95 border border-gray-700 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-black/30">
          <div className="text-sm text-gray-300">3D Preview</div>
          <div className="flex items-center gap-2">
            {stlUrl && (
              <a
                href={stlUrl}
                download={downloadName}
                className="px-3 py-1.5 text-sm rounded-md bg-gradient-to-r from-gray-800 to-gray-700 text-white border border-gray-600 hover:from-gray-700 hover:to-gray-600"
              >
                Download STL
              </a>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-md bg-gradient-to-r from-gray-800 to-gray-700 text-white border border-gray-600 hover:from-gray-700 hover:to-gray-600"
            >
              Close
            </button>
          </div>
        </div>
        {/* Canvas Container */}
        <div
          ref={containerRef}
          className="absolute inset-0 pt-10"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
            backgroundPosition: '0 0'
          }}
        />
      </div>
    </div>
  )
}


