'use client'

/**
 * StlViewerModal.tsx
 * 
 * A React modal component that renders an interactive 3D preview of STL files using Three.js.
 * This component is used to display generated glove models in a user-friendly 3D viewer
 * with orbit controls, allowing users to rotate, pan, and zoom the model before downloading.
 * 
 * Features:
 * - WebGL-based 3D rendering with Three.js
 * - Interactive orbit controls (rotate, pan, zoom)
 * - Automatic model centering and scaling
 * - Responsive design with resize handling
 * - Download functionality for the STL file
 * - Smooth damped camera movements
 * - Subtle grid helper for spatial reference
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

/**
 * Props interface for the StlViewerModal component
 * @property isOpen - Controls the visibility of the modal
 * @property onClose - Callback function triggered when the modal should close
 * @property stlUrl - Blob URL or path to the STL file to display (null if no model loaded)
 * @property downloadName - Optional filename used when downloading the STL (defaults to 'model.stl')
 * @property isLoading - Optional loading state while STL is being fetched
 */
interface StlViewerModalProps {
  isOpen: boolean
  onClose: () => void
  stlUrl: string | null
  downloadName?: string
  isLoading?: boolean
}

export default function StlViewerModal({ isOpen, onClose, stlUrl, downloadName = 'model.stl', isLoading = false }: StlViewerModalProps) {
  // ============================================================================
  // Refs for Three.js objects
  // Using refs instead of state because Three.js objects don't need to trigger
  // React re-renders and we need direct access to mutate them in the animation loop
  // ============================================================================
  
  /** Reference to the container div where the WebGL canvas will be mounted */
  const containerRef = useRef<HTMLDivElement>(null)
  
  /** WebGL renderer instance - handles all GPU rendering operations */
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  
  /** The 3D scene graph - contains all objects, lights, and helpers */
  const sceneRef = useRef<THREE.Scene | null>(null)
  
  /** Perspective camera with field of view, aspect ratio, and clipping planes */
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  
  /** OrbitControls instance for mouse/touch interaction with the camera */
  const controlsRef = useRef<OrbitControls | null>(null)
  
  /** Reference to the currently loaded STL mesh for cleanup and replacement */
  const meshRef = useRef<THREE.Mesh | null>(null)

  // ============================================================================
  // Three.js Scene Initialization Effect
  // This effect runs when the modal opens to set up the entire 3D rendering pipeline
  // ============================================================================
  useEffect(() => {
    // Don't initialize if modal is closed
    if (!isOpen) return
    const container = containerRef.current
    if (!container) return

    // Get container dimensions for setting up the renderer and camera
    const width = container.clientWidth
    const height = container.clientHeight

    // -------------------------------------------------------------------------
    // Renderer Setup
    // Create a WebGL renderer with antialiasing for smooth edges and alpha
    // for transparent background (allows CSS background to show through)
    // -------------------------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    // Limit pixel ratio to 2 for performance on high-DPI displays
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    rendererRef.current = renderer
    // Mount the canvas element to the DOM
    container.appendChild(renderer.domElement)

    // -------------------------------------------------------------------------
    // Scene Setup
    // The scene is the container for all 3D objects - setting background to null
    // makes it transparent, allowing our CSS gradient background to show
    // -------------------------------------------------------------------------
    const scene = new THREE.Scene()
    scene.background = null
    sceneRef.current = scene

    // -------------------------------------------------------------------------
    // Camera Setup
    // Using a perspective camera for realistic 3D depth perception
    // Parameters: field of view (45°), aspect ratio, near plane (0.1), far plane (1000)
    // -------------------------------------------------------------------------
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    // Position camera along Z-axis, looking at origin
    camera.position.set(0, -120, 120)
    cameraRef.current = camera

    // -------------------------------------------------------------------------
    // Lighting Setup
    // Using a multi-light setup for realistic, soft illumination of the 3D model:
    // - Ambient: Base illumination to prevent completely dark areas
    // - Key light: Main directional light from upper-right
    // - Fill light: Softer light to reduce harsh shadows
    // - Hemisphere: Subtle color gradient from sky to ground
    // -------------------------------------------------------------------------
    
    // Ambient light - provides uniform illumination to all surfaces
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    
    // Key light - main directional light (like the sun)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
    keyLight.position.set(1, 1, 1) // Coming from upper-right-front
    scene.add(keyLight)
    
    // Fill light - softer light to reduce contrast and fill shadows
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
    fillLight.position.set(-1, -0.5, -1) // Coming from lower-left-back
    scene.add(fillLight)
    
    // Hemisphere light - adds subtle color variation (indigo sky, dark ground)
    // This gives the model a slight color tint matching the app's color scheme
    const hemiLight = new THREE.HemisphereLight(0x4f46e5, 0x0b0f19, 0.25)
    scene.add(hemiLight)

    // -------------------------------------------------------------------------
    // Grid Helper
    // A subtle grid on the "floor" provides spatial reference and helps users
    // understand the model's scale and orientation
    // -------------------------------------------------------------------------
    const grid = new THREE.GridHelper(200, 20, 0x333333, 0x222222)
    grid.position.y = -50 // Position below the model
    grid.material.opacity = 0.15 // Very subtle, non-distracting
    ;(grid.material as THREE.Material).transparent = true
    scene.add(grid)

    // -------------------------------------------------------------------------
    // Orbit Controls Setup
    // Allows users to interact with the 3D view using mouse/touch:
    // - Left click + drag: Rotate around the model
    // - Right click + drag: Pan the view
    // - Scroll wheel: Zoom in/out
    // -------------------------------------------------------------------------
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true // Smooth camera movement with inertia
    controls.dampingFactor = 0.05 // How quickly the damping settles
    controls.screenSpacePanning = false // Pan parallel to the ground plane
    controls.minDistance = 30 // Minimum zoom distance (can't get too close)
    controls.maxDistance = 400 // Maximum zoom distance (can't get too far)
    controls.target.set(0, 0, 0) // Look at the origin where the model is centered
    controls.update()
    controlsRef.current = controls

    // -------------------------------------------------------------------------
    // Animation Loop
    // requestAnimationFrame-based loop that continuously renders the scene
    // This is necessary for smooth orbit controls and any future animations
    // -------------------------------------------------------------------------
    let animationFrameId: number
    const animate = () => {
      // Update controls for damping effect (must be called each frame)
      controls.update()
      // Render the scene from the camera's perspective
      renderer.render(scene, camera)
      // Schedule the next frame
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()

    // -------------------------------------------------------------------------
    // Resize Handler
    // Updates camera aspect ratio and renderer size when the window is resized
    // This ensures the 3D view always fills its container correctly
    // -------------------------------------------------------------------------
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      // Update camera aspect ratio to match new container dimensions
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      // Update renderer output size
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // -------------------------------------------------------------------------
    // Cleanup Function
    // Properly disposes of all Three.js resources when the modal closes
    // This prevents memory leaks and GPU resource exhaustion
    // -------------------------------------------------------------------------
    return () => {
      // Stop the animation loop
      cancelAnimationFrame(animationFrameId)
      // Remove event listeners
      window.removeEventListener('resize', handleResize)
      // Dispose of controls and renderer
      controls.dispose()
      renderer.dispose()
      // Remove the canvas from the DOM
      container.removeChild(renderer.domElement)
      // Clean up the mesh geometry and material
      if (meshRef.current) {
        meshRef.current.geometry.dispose()
        ;(meshRef.current.material as THREE.Material).dispose()
        meshRef.current = null
      }
      // Clear all objects from the scene
      scene.clear()
      // Reset all refs to null
      sceneRef.current = null
      cameraRef.current = null
      rendererRef.current = null
      controlsRef.current = null
    }
  }, [isOpen]) // Re-run when modal open state changes

  // ============================================================================
  // STL Loading Effect
  // Loads the STL file when a new URL is provided and the modal is open
  // ============================================================================
  useEffect(() => {
    // Guard clauses - don't load if conditions aren't met
    if (!isOpen) return
    if (!stlUrl) return
    if (!sceneRef.current) return

    // Create an STL loader instance
    const loader = new STLLoader()
    
    // Load the STL file from the provided URL
    loader.load(
      stlUrl,
      // Success callback - called when geometry is loaded
      geometry => {
        // -----------------------------------------------------------------------
        // Clean Up Previous Model
        // If there's an existing mesh, remove it and dispose its resources
        // before loading the new one
        // -----------------------------------------------------------------------
        if (meshRef.current) {
          sceneRef.current!.remove(meshRef.current)
          meshRef.current.geometry.dispose()
          ;(meshRef.current.material as THREE.Material).dispose()
          meshRef.current = null
        }

        // -----------------------------------------------------------------------
        // Geometry Processing
        // Compute bounding box for centering and scaling calculations
        // -----------------------------------------------------------------------
        geometry.computeBoundingBox()
        geometry.computeBoundingSphere()
        const bbox = geometry.boundingBox!
        
        // Calculate the size of the model along each axis
        const size = new THREE.Vector3()
        bbox.getSize(size)
        
        // Find the largest dimension to calculate uniform scaling
        const maxDim = Math.max(size.x, size.y, size.z)
        
        // Scale the model to fit within a target size of 120 units
        // This ensures models of any original size display at a reasonable scale
        const targetSize = 90
        const scale = maxDim > 0 ? targetSize / maxDim : 1

        // -----------------------------------------------------------------------
        // Material and Mesh Creation
        // Using MeshStandardMaterial for physically-based rendering
        // The slate gray color matches the app's design aesthetic
        // -----------------------------------------------------------------------
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x94a3b8, // Slate gray
          metalness: 0.35, // Slight metallic sheen
          roughness: 0.25  // Fairly smooth surface for nice reflections
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.scale.setScalar(scale) // Apply uniform scaling

        // -----------------------------------------------------------------------
        // Center the Model
        // Calculate the geometric center and offset the mesh position
        // so the model appears centered at the origin
        // -----------------------------------------------------------------------
        const center = new THREE.Vector3()
        bbox.getCenter(center)
        // Subtract the scaled center from position to center the mesh
        mesh.position.sub(center.multiplyScalar(scale))

        // Add the mesh to the scene and store reference for future cleanup
        sceneRef.current!.add(mesh)
        meshRef.current = mesh
      },
      // Progress callback - not used but required by the API
      undefined,
      // Error callback - log any loading errors
      error => {
        console.error('Failed to load STL:', error)
      }
    )
  }, [isOpen, stlUrl]) // Re-run when modal opens or STL URL changes

  // ============================================================================
  // Render
  // Don't render anything if the modal is closed
  // ============================================================================
  if (!isOpen) return null

  return (
    // Modal overlay - fixed position covering the entire viewport
    <div className="fixed inset-0 z-50 flex items-start justify-center px-2 pt-6 pb-2 sm:px-4 sm:pt-10 sm:pb-4">
      {/* 
        Backdrop
        Semi-transparent black overlay with blur effect
        Clicking on it closes the modal (standard UX pattern)
      */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* 
        Modal Content Container
        Dark gradient background with subtle border and rounded corners
        Responsive sizing: full width on mobile, constrained on larger screens
      */}
      <div className="relative w-full sm:w-[92vw] max-w-full sm:max-w-5xl h-[75vh] sm:h-[72vh] bg-gradient-to-b from-gray-900/95 to-black/95 border border-gray-700 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
        
        {/* 
          Header Bar
          Contains title and action buttons (download, close)
          Fixed at top with semi-transparent background
        */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-black/30">
          <div className="text-sm text-gray-300">3D Preview</div>
          <div className="flex items-center gap-2">
            {/* 
              Download Button
              Only shown when an STL URL is available
              Uses the downloadName prop for the filename
            */}
            {stlUrl && (
              <a
                href={stlUrl}
                download={downloadName}
                className="px-3 py-1.5 text-sm rounded-md bg-gradient-to-r from-gray-800 to-gray-700 text-white border border-gray-600 hover:from-gray-700 hover:to-gray-600"
              >
                Download STL
              </a>
            )}
            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-md bg-gradient-to-r from-gray-800 to-gray-700 text-white border border-gray-600 hover:from-gray-700 hover:to-gray-600"
            >
              Close
            </button>
          </div>
        </div>
        
        {/* 
          Three.js Canvas Container
          The WebGL canvas is mounted here via the ref
          The dot pattern background provides visual texture when no model is loaded
          pt-10 adds padding to account for the header bar
        */}
        <div
          ref={containerRef}
          className="absolute inset-0 pt-10"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
            backgroundPosition: '0 0'
          }}
        />
        
        {/* Loading overlay - shown while STL is being fetched */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-gray-300 text-sm">Loading model...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
