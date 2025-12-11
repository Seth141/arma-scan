'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Square, Play, Pause, RotateCcw, Ruler, Target, Loader2, CheckCircle2, Hand, MousePointer, Gauge, Settings2 } from 'lucide-react'
import { GloveSize, GLOVE_SIZES } from './GloveSizeSelector'
import StlViewerModal from './StlViewerModal'

interface HandScannerProps {
  onMeasurementsUpdate: (measurements: {
    palmWidth: number
    palmLength: number
    fingerLengths: { [key: string]: number }
    totalHandLength: number
  } | null) => void
  isScanning: boolean
  setIsScanning: (scanning: boolean) => void
  onCalibrationChange?: (calibrated: boolean) => void
  gloveSize: GloveSize | null
}

export default function HandScanner({ onMeasurementsUpdate, isScanning, setIsScanning, onCalibrationChange, gloveSize }: HandScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isFrontCamera, setIsFrontCamera] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [handDetected, setHandDetected] = useState(false)
  const [isCalibrated, setIsCalibrated] = useState(false)
  const [calibrationFactor, setCalibrationFactor] = useState(1)
  const [showHandGuide, setShowHandGuide] = useState(true)
  const [handFitScore, setHandFitScore] = useState(0)
  const [lastValidMeasurements, setLastValidMeasurements] = useState<{
    palmWidth: number
    palmLength: number
    fingerLengths: { [key: string]: number }
    totalHandLength: number
  } | null>(null)

  // Guided left-right scan state
  const [requiredHand, setRequiredHand] = useState<'left' | 'right'>('left')
  const [leftScanComplete, setLeftScanComplete] = useState<boolean>(false)
  const [rightScanComplete, setRightScanComplete] = useState<boolean>(false)
  const [isProcessingScan, setIsProcessingScan] = useState<boolean>(false)
  const [currentHandedness, setCurrentHandedness] = useState<'left' | 'right' | null>(null)
  const [showOrderButton, setShowOrderButton] = useState<boolean>(false)
  const [spinnerDisplayCount, setSpinnerDisplayCount] = useState<number>(0)
  const prevIsProcessingRef = useRef<boolean>(false)
  const animationStartTimeRef = useRef<number>(performance.now())

  // STL preview modal state
  const [isStlViewerOpen, setIsStlViewerOpen] = useState<boolean>(false)
  const [stlObjectUrl, setStlObjectUrl] = useState<string | null>(null)
  const [stlDownloadName, setStlDownloadName] = useState<string>('model.stl')
  const hasAutoOpenedStlRef = useRef<boolean>(false)

  // Simple scan counters for reliable UI control
  const [leftScanCount, setLeftScanCount] = useState<number>(0)
  const [rightScanCount, setRightScanCount] = useState<number>(0)
  const bothHandsScanned = leftScanCount >= 1 && rightScanCount >= 1

  // Debug state changes
  useEffect(() => {
    console.log('🔄 STATE CHANGE - leftScanCount:', leftScanCount)
  }, [leftScanCount])

  useEffect(() => {
    console.log('🔄 STATE CHANGE - rightScanCount:', rightScanCount)
  }, [rightScanCount])

  useEffect(() => {
    console.log('🔄 STATE CHANGE - bothHandsScanned:', bothHandsScanned)
  }, [bothHandsScanned])

  // Rotation tracking
  const prevAngleRef = useRef<number | null>(null)
  const accumulatedRotationRef = useRef<number>(0)
  const steadyStartRef = useRef<number | null>(null)

  const bothScansComplete = leftScanComplete && rightScanComplete
  const [allScansComplete, setAllScansComplete] = useState<boolean>(false)

  // STL preview functionality
  const previewSTL = async () => {
    if (!gloveSize) {
      console.error('No glove size selected')
      return
    }

    // Map glove sizes to STL file names
    const sizeToFilename: Record<GloveSize, string> = {
      'S': 'arma_small.stl',
      'M': 'arma_medium.stl', 
      'L': 'arma_large.stl',
      'XL': 'arma_xl.stl',
      '2XL': 'arma_2xl.stl',
      '3XL': 'arma_3xl.stl'
    }

    const filename = sizeToFilename[gloveSize]
    const filePath = `/base_stls/${filename}`

    try {
      const response = await fetch(filePath)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      // set state for modal
      setStlObjectUrl(url)
      setStlDownloadName(filename)
      setIsStlViewerOpen(true)
    } catch (error) {
      console.error('Error downloading STL file:', error)
      alert('Error downloading file. Please try again.')
    }
  }

  const handleCloseStlViewer = () => {
    if (stlObjectUrl) {
      window.URL.revokeObjectURL(stlObjectUrl)
    }
    setStlObjectUrl(null)
    setIsStlViewerOpen(false)
  }

  // Auto-open STL preview after both scans complete (once)
  useEffect(() => {
    if (bothHandsScanned && showOrderButton && !isStlViewerOpen && !stlObjectUrl && !hasAutoOpenedStlRef.current) {
      hasAutoOpenedStlRef.current = true
      previewSTL()
    }
  }, [bothHandsScanned, showOrderButton, isStlViewerOpen, stlObjectUrl])

  // Ensure we mark all complete any time both flags are true
  useEffect(() => {
    if (leftScanComplete && rightScanComplete) {
      setAllScansComplete(true)
    }
  }, [leftScanComplete, rightScanComplete])

  // Refs to keep stable instances and latest values without retriggering effects
  const handsRef = useRef<any>(null)
  const frameIdRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const gloveSizeRef = useRef<GloveSize | null>(gloveSize)
  const isCalibratedRef = useRef<boolean>(isCalibrated)
  const calibrationFactorRef = useRef<number>(calibrationFactor)
  const lastValidMeasurementsRef = useRef<typeof lastValidMeasurements>(lastValidMeasurements)
  const onMeasurementsUpdateRef = useRef(onMeasurementsUpdate)
  const onCalibrationChangeRef = useRef(onCalibrationChange)

  // Keep refs in sync with latest values
  useEffect(() => { gloveSizeRef.current = gloveSize }, [gloveSize])
  useEffect(() => { isCalibratedRef.current = isCalibrated }, [isCalibrated])
  useEffect(() => { calibrationFactorRef.current = calibrationFactor }, [calibrationFactor])
  useEffect(() => { lastValidMeasurementsRef.current = lastValidMeasurements }, [lastValidMeasurements])
  useEffect(() => { onMeasurementsUpdateRef.current = onMeasurementsUpdate }, [onMeasurementsUpdate])
  useEffect(() => { onCalibrationChangeRef.current = onCalibrationChange }, [onCalibrationChange])

  // Hand connections for drawing
  const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], // thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // index finger
    [0, 9], [9, 10], [10, 11], [11, 12], // middle finger
    [0, 13], [13, 14], [14, 15], [15, 16], // ring finger
    [0, 17], [17, 18], [18, 19], [19, 20], // pinky
    [0, 5], [5, 9], [9, 13], [13, 17] // palm connections
  ]

  // Helper function to draw rounded rectangle
  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  // Target hand size as percentage of canvas (works on any screen size)
  const TARGET_HAND_WIDTH_PERCENT = 0.45 // 45% of canvas width
  const TARGET_HAND_HEIGHT_PERCENT = 0.55 // 55% of canvas height

  // Calculate calibration factor based on detected palm width vs expected glove size
  const calculateGloveSizeCalibration = (detectedPalmWidthPixels: number, expectedPalmWidthCm: number) => {
    // This gives us pixels per cm ratio
    return expectedPalmWidthCm / detectedPalmWidthPixels
  }



  // Calculate how well the hand fits the guide
  const calculateHandFitScore = (landmarks: any[]) => {
    if (!landmarks || landmarks.length === 0) return 0

    const canvas = canvasRef.current
    if (!canvas) return 0

    const width = canvas.width
    const height = canvas.height

    // Calculate hand bounds as percentage of canvas
    let minX = 1, maxX = 0, minY = 1, maxY = 0
    landmarks.forEach((landmark: any) => {
      minX = Math.min(minX, landmark.x)
      maxX = Math.max(maxX, landmark.x)
      minY = Math.min(minY, landmark.y)
      maxY = Math.max(maxY, landmark.y)
    })

    // Hand size as percentage of canvas
    const handWidthPercent = maxX - minX
    const handHeightPercent = maxY - minY

    // Calculate fit score based on how close the hand size is to target percentage
    // More lenient scoring - reward hands that are at least 25% of the target size
    const widthRatio = Math.min(handWidthPercent / TARGET_HAND_WIDTH_PERCENT, TARGET_HAND_WIDTH_PERCENT / handWidthPercent)
    const heightRatio = Math.min(handHeightPercent / TARGET_HAND_HEIGHT_PERCENT, TARGET_HAND_HEIGHT_PERCENT / handHeightPercent)
    
    // Boost the score to make it easier to reach higher percentages
    const rawScore = widthRatio * heightRatio * 100
    const boostedScore = Math.min(rawScore * 1.3, 100)
    
    return boostedScore
  }

  // Results handler uses refs to access latest values without retriggering setup
  const handleResults = (results: any) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0]
      // Determine handedness if available
      let rawHandedness: 'left' | 'right' | null = null
      let adjustedHandedness: 'left' | 'right' | null = null
      try {
        const label: string | undefined = results.multiHandedness?.[0]?.label
        if (label) {
          const raw = label.toLowerCase()
          if (raw === 'left' || raw === 'right') {
            rawHandedness = raw
            adjustedHandedness = isFrontCamera ? (raw === 'left' ? 'right' : 'left') : raw
            setCurrentHandedness(adjustedHandedness)
          }
        }
      } catch (_) {
        // ignore
      }
      setHandDetected(true)

      // Calculate fit score
      const fitScore = calculateHandFitScore(landmarks)
      setHandFitScore(fitScore)

      // Auto-calibrate if we have a glove size selected and good hand fit
      const currentGlove = gloveSizeRef.current
      if (currentGlove && !isCalibratedRef.current && fitScore > 70) {
        const canvas = canvasRef.current
        if (canvas) {
          const width = canvas.width
          const height = canvas.height

          // Calculate detected palm width in pixels
          const detectedPalmWidthPixels = Math.sqrt(
            Math.pow((landmarks[5].x - landmarks[17].x) * width, 2) +
            Math.pow((landmarks[5].y - landmarks[17].y) * height, 2)
          )

          // Get expected palm width from glove size
          const expectedPalmWidthCm = GLOVE_SIZES[currentGlove].palmWidth

          // Calculate calibration factor
          const calibrationRatio = calculateGloveSizeCalibration(detectedPalmWidthPixels, expectedPalmWidthCm)
          setCalibrationFactor(calibrationRatio)
          calibrationFactorRef.current = calibrationRatio
          setIsCalibrated(true)
          isCalibratedRef.current = true
          onCalibrationChangeRef.current?.(true)
        }
      }

      // Determine which hand we need next based on scan counts
      const needsLeft = leftScanCount === 0
      const needsRight = leftScanCount >= 1 && rightScanCount === 0
      const currentlyNeededHand = needsLeft ? 'left' : needsRight ? 'right' : null
      
      // Check if the detected hand matches what we need
      // If no specific hand is needed, accept any hand
      // If a specific hand is needed, check both raw and adjusted handedness
      const handMatches = currentlyNeededHand === null || 
                         (rawHandedness === currentlyNeededHand) ||
                         (adjustedHandedness === currentlyNeededHand)
      
      console.log('=== SCAN DEBUG ===', {
        leftScanCount,
        rightScanCount,
        needsLeft,
        needsRight,
        currentlyNeededHand,
        rawHandedness,
        adjustedHandedness,
        handMatches,
        fitScore,
        isProcessingScan,
        bothHandsScanned
      })
      
      // More lenient condition for right hand scanning
      const shouldScan = (handMatches || currentlyNeededHand === 'right') &&
                        fitScore > 60 &&
                        !isProcessingScan &&
                        currentlyNeededHand !== null

      console.log('=== SCAN CONDITION ===', {
        handMatches,
        currentlyNeededHand,
        fitScore,
        isProcessingScan,
        shouldScan
      })

      if (shouldScan) {
        const canvas = canvasRef.current
        if (canvas) {
          const width = canvas.width
          const height = canvas.height
          // Vector from wrist (0) to index MCP (5)
          const dx = (landmarks[5].x - landmarks[0].x) * width
          const dy = (landmarks[5].y - landmarks[0].y) * height
          const magnitude = Math.hypot(dx, dy)
          if (magnitude > 20) {
            const angle = Math.atan2(dy, dx) // radians
            const prev = prevAngleRef.current
            if (prev !== null) {
              // Normalize smallest difference
              let delta = angle - prev
              while (delta > Math.PI) delta -= 2 * Math.PI
              while (delta < -Math.PI) delta += 2 * Math.PI
              // Cap per-frame delta to limit noise
              const deltaDeg = Math.min(30, Math.max(-30, (delta * 180) / Math.PI))
              accumulatedRotationRef.current += Math.abs(deltaDeg)
            }
            prevAngleRef.current = angle
          }
          // Start or continue steady timer
          const now = performance.now()
          if (steadyStartRef.current === null) {
            steadyStartRef.current = now
          }
          // If enough rotation accumulated, mark scan complete for this hand
          const heldLongEnough = steadyStartRef.current !== null && now - steadyStartRef.current >= 1200
          const rotationCompleted = accumulatedRotationRef.current >= 160
          
          console.log('=== COMPLETION CHECK ===', {
            rotationAccumulated: accumulatedRotationRef.current,
            rotationCompleted,
            heldLongEnough,
            timeHeld: steadyStartRef.current ? now - steadyStartRef.current : 0,
            currentlyNeededHand
          })
          
          if (rotationCompleted || heldLongEnough) {
            console.log('🚀 TRIGGERING SCAN COMPLETION FOR:', currentlyNeededHand)
            setIsProcessingScan(true)
            // Store which hand was detected at scan time
            const scanningHand = currentlyNeededHand
            setTimeout(() => {
              setIsProcessingScan(false)
              console.log('⏰ TIMEOUT COMPLETING SCAN FOR:', scanningHand)
              
              if (scanningHand === 'left') {
                console.log('✅ SETTING LEFT SCAN COMPLETE')
                setLeftScanComplete(true)
                setLeftScanCount(prev => {
                  console.log('📊 LEFT COUNT:', prev, '->', prev + 1)
                  return prev + 1
                })
              } else if (scanningHand === 'right') {
                console.log('✅ SETTING RIGHT SCAN COMPLETE')
                setRightScanComplete(true)
                setRightScanCount(prev => {
                  console.log('📊 RIGHT COUNT:', prev, '->', prev + 1)
                  // Force immediate UI update by setting both states together
                  setAllScansComplete(true)
                  setShowOrderButton(true)
                  return prev + 1
                })
              }
              
              // Reset for next hand
              accumulatedRotationRef.current = 0
              prevAngleRef.current = null
              steadyStartRef.current = null
            }, 3000)
          }
        }
      } else {
        // Reset rotation accumulation when hand not matching or not stable
        prevAngleRef.current = null
        accumulatedRotationRef.current = 0
        steadyStartRef.current = null
      }

      // Calculate measurements if calibrated and hand fits well
      if (isCalibratedRef.current && fitScore > 70) {
        const measurements = calculateHandMeasurements(landmarks)
        if (measurements) {
          setLastValidMeasurements(measurements)
          lastValidMeasurementsRef.current = measurements
          onMeasurementsUpdateRef.current(measurements)
        }
      }

      // Draw visualization
      const canvas = canvasRef.current
      const video = videoRef.current
      if (canvas && video) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // If scanning is complete, do not render any on-canvas guidance
          if (bothHandsScanned) {
            return
          }

          // Draw hand landmarks
          const width = canvas.width
          const height = canvas.height

          // Draw connections
          if (fitScore > 75) {
            // Create pulsing green effect when fit score is high
            const currentTime = performance.now()
            const elapsed = (currentTime - animationStartTimeRef.current) / 1000 // Convert to seconds
            const pulseSpeed = 0.8 // Pulses per second
            const opacity = 0.5 + 0.5 * Math.sin(elapsed * pulseSpeed * Math.PI * 2) // Oscillate between 0.5 and 1
            
            // Draw each connection with glow effect
            HAND_CONNECTIONS.forEach(([start, end]) => {
              const startPoint = landmarks[start]
              const endPoint = landmarks[end]
              
              // Draw mint green pulsing glow around edges
              ctx.strokeStyle = `rgba(152, 251, 152, ${opacity * 0.6})` // Light mint green with pulsing opacity
              ctx.lineWidth = 6
              ctx.beginPath()
              ctx.moveTo(startPoint.x * width, startPoint.y * height)
              ctx.lineTo(endPoint.x * width, endPoint.y * height)
              ctx.stroke()
              
              // Draw mint green core line
              ctx.strokeStyle = 'rgba(102, 205, 170, 1)' // Solid mint green
              ctx.lineWidth = 2
              ctx.beginPath()
              ctx.moveTo(startPoint.x * width, startPoint.y * height)
              ctx.lineTo(endPoint.x * width, endPoint.y * height)
              ctx.stroke()
            })
          } else {
            // Use white color when fit score is 75% or below
            ctx.strokeStyle = '#FFFFFF'
            ctx.lineWidth = 2
            HAND_CONNECTIONS.forEach(([start, end]) => {
              const startPoint = landmarks[start]
              const endPoint = landmarks[end]
              ctx.beginPath()
              ctx.moveTo(startPoint.x * width, startPoint.y * height)
              ctx.lineTo(endPoint.x * width, endPoint.y * height)
              ctx.stroke()
            })
          }



          // Draw landmarks
          // Use mint green color when fit score is over 75%, otherwise keep cyan
          ctx.fillStyle = fitScore > 75 ? 'rgba(102, 205, 170, 1)' : '#00FFFF'
          landmarks.forEach((landmark: any) => {
            ctx.beginPath()
            ctx.arc(landmark.x * width, landmark.y * height, 3, 0, 2 * Math.PI)
            ctx.fill()
          })

          // Status text moved to UI panel below the video
        }
      }
    } else {
      setHandDetected(false)
      setHandFitScore(0)
      // Keep last valid measurements visible instead of clearing
      onMeasurementsUpdateRef.current(lastValidMeasurementsRef.current)
    }
  }

  // Track spinner appearances: increment when processing finishes (falling edge)
  useEffect(() => {
    const wasProcessing = prevIsProcessingRef.current
    if (wasProcessing && !isProcessingScan) {
      setSpinnerDisplayCount((count) => count + 1)
    }
    prevIsProcessingRef.current = isProcessingScan
  }, [isProcessingScan])

  // Once spinner has been displayed twice, reveal the order button
  useEffect(() => {
    if (spinnerDisplayCount >= 2) {
      setShowOrderButton(true)
    }
  }, [spinnerDisplayCount])


  // Load MediaPipe Hands once on mount
  useEffect(() => {
    let cancelled = false
    const loadHands = async () => {
      try {
        if (!(window as any).Hands) {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js'
          document.head.appendChild(script)
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
          })
        }
        if (cancelled) return
        const hands = new (window as any).Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
        })
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })
        hands.onResults(handleResults)
        handsRef.current = hands
      } catch (err) {
        console.error('Error loading MediaPipe Hands:', err)
        setError('Failed to initialize hand tracking. Please try again.')
      }
    }
    loadHands()
    return () => {
      cancelled = true
      if (handsRef.current) {
        handsRef.current.close()
        handsRef.current = null
      }
    }
  }, [])

  // Manage camera start/stop based only on isScanning
  useEffect(() => {
    let stopped = false
    const startCamera = async () => {
      try {
        // Wait until hands is ready
        const waitForHands = async () => {
          const start = Date.now()
          while (!handsRef.current && Date.now() - start < 5000) {
            await new Promise(res => setTimeout(res, 50))
          }
        }
        await waitForHands()
        if (!handsRef.current) return

        const constraints = { video: { width: 640, height: 480, facingMode: 'user' as const } }
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        setIsFrontCamera(true)
        streamRef.current = stream
        if (!videoRef.current) return
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setIsCameraActive(true)

          const processFrame = async () => {
            if (!isScanning || stopped) return
            if (videoRef.current && handsRef.current) {
              await handsRef.current.send({ image: videoRef.current })
            }
            frameIdRef.current = requestAnimationFrame(processFrame)
          }
          processFrame()
        }
      } catch (err) {
        console.error('Error initializing camera:', err)
        setError('Failed to initialize camera. Please check permissions and try again.')
      }
    }

    if (isScanning) {
      startCamera()
    }

    return () => {
      stopped = true
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current)
        frameIdRef.current = null
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
      streamRef.current = null
      setIsCameraActive(false)
    }
  }, [isScanning])

const drawHandGuide = () => {
  // Guide removed
}

const calculateHandMeasurements = (landmarks: any[]) => {
  // Convert landmarks to pixel coordinates
  const canvas = canvasRef.current
  if (!canvas) return null

  const width = canvas.width
  const height = canvas.height

  // Use calibration factor from glove size (via ref to avoid stale values in handler)
  const pixelToCm = calibrationFactorRef.current

  // Palm measurements (using wrist and palm landmarks)
  const wrist = landmarks[0]
  const palmCenter = landmarks[9]
  const palmWidth = Math.sqrt(
    Math.pow((landmarks[5].x - landmarks[17].x) * width, 2) +
    Math.pow((landmarks[5].y - landmarks[17].y) * height, 2)
  ) * pixelToCm
  const palmLength = Math.sqrt(
    Math.pow((wrist.x - palmCenter.x) * width, 2) +
    Math.pow((wrist.y - palmCenter.y) * height, 2)
  ) * pixelToCm

  // Finger measurements
  const fingerLengths = {
    thumb: calculateFingerLength(landmarks, [2, 3, 4], width, height, pixelToCm),
    index: calculateFingerLength(landmarks, [5, 6, 7, 8], width, height, pixelToCm),
    middle: calculateFingerLength(landmarks, [9, 10, 11, 12], width, height, pixelToCm),
    ring: calculateFingerLength(landmarks, [13, 14, 15, 16], width, height, pixelToCm),
    pinky: calculateFingerLength(landmarks, [17, 18, 19, 20], width, height, pixelToCm)
  }

  // Total hand length (wrist to middle finger tip)
  const totalHandLength = Math.sqrt(
    Math.pow((wrist.x - landmarks[12].x) * width, 2) +
    Math.pow((wrist.y - landmarks[12].y) * height, 2)
  ) * pixelToCm

  return {
    palmWidth,
    palmLength,
    fingerLengths,
    totalHandLength
  }
}

const calculateFingerLength = (landmarks: any[], fingerIndices: number[], width: number, height: number, pixelToCm: number) => {
  let totalLength = 0
  for (let i = 0; i < fingerIndices.length - 1; i++) {
    const current = landmarks[fingerIndices[i]]
    const next = landmarks[fingerIndices[i + 1]]
    const length = Math.sqrt(
      Math.pow((current.x - next.x) * width, 2) +
      Math.pow((current.y - next.y) * height, 2)
    )
    totalLength += length
  }
  return totalLength * pixelToCm
}

const toggleScanning = () => {
  setIsScanning(!isScanning)
  if (!isScanning) {
    setError(null)
  }
}

const resetCamera = () => {
  setIsScanning(false)
  setTimeout(() => setIsScanning(true), 100)
}

const toggleHandGuide = () => {
  setShowHandGuide(!showHandGuide)
}

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Control buttons - compact on mobile */}
      <div className="-mx-4 sm:mx-0 sm:flex sm:justify-center">
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap sm:justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleScanning}
            className={`col-span-1 sm:col-auto w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium transition-colors active:scale-[.98] text-sm sm:text-base ${
            isScanning
              ? 'bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 hover:from-gray-800/95 hover:via-gray-700/95 hover:to-gray-800/95 text-white border border-gray-700'
              : 'bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 hover:from-gray-800/95 hover:via-gray-700/95 hover:to-gray-800/95 text-white border border-gray-700'
          }`}
        >
          {isScanning ? (
            <>
              <Pause className="w-4 h-4 inline mr-1 sm:mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 inline mr-1 sm:mr-2" />
              Start
            </>
          )}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetCamera}
            className="col-span-1 sm:col-auto w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 hover:from-gray-800/95 hover:via-gray-700/95 hover:to-gray-800/95 text-white rounded-lg font-medium transition-colors border border-gray-700 active:scale-[.98] text-sm sm:text-base"
        >
          <RotateCcw className="w-4 h-4 inline mr-1 sm:mr-2" />
          Reset
        </motion.button>
      </div>
    </div>

    {/* Camera view - much larger on mobile */}
    <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700 -mx-4 sm:mx-0">
      <video
        ref={videoRef}
        className="w-full min-h-[32vh] sm:min-h-0 sm:h-80 object-cover"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        width={640}
        height={480}
      />
      
      {!isCameraActive && isScanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <Camera className="w-12 h-12 text-white animate-pulse" />
        </div>
      )}

      {/* Show only hand detection label on the video feed */}

      {/* Mobile-friendly status indicators */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-start gap-2">
        {/* Hand detection status */}
        {handDetected && (
          <div className="bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-700 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${handFitScore > 70 ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span>{currentHandedness ? `${currentHandedness.charAt(0).toUpperCase()}${currentHandedness.slice(1)}` : 'Hand'}</span>
            </div>
          </div>
        )}
        
        {/* Required hand indicator */}
        {!bothHandsScanned && !showOrderButton && (
          <div className="bg-gradient-to-r from-indigo-900/95 via-indigo-800/95 to-indigo-900/95 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium border border-indigo-700 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <Hand className="w-3 h-3" />
              <span>Need: {leftScanCount >= 1 && rightScanCount === 0 ? 'right' : leftScanCount === 0 ? 'left' : 'scanning'} hand</span>
            </div>
          </div>
        )}
      </div>

      {/* Camera guidance overlay for mobile */}
      {!handDetected && isCameraActive && !bothHandsScanned && !showOrderButton && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 m-4 text-center border border-gray-600">
            <Hand className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white text-sm font-medium mb-1">
              {leftScanCount >= 1 && rightScanCount === 0 ? 'Show your right hand' : 
               leftScanCount === 0 ? 'Show your left hand' : 
               'Show your hand'}
            </p>
            <p className="text-gray-300 text-xs">
              Position it in the center of the frame
            </p>
          </div>
        </div>
      )}

      {/* Fit score indicator for mobile */}
      {handDetected && handFitScore < 70 && !showOrderButton && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <div className="bg-yellow-900/90 text-yellow-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-yellow-700 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3" />
              <span>Move closer ({Math.round(handFitScore)}%)</span>
            </div>
          </div>
        </div>
      )}

      {isProcessingScan && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="flex items-center gap-2 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Scanning</span>
          </div>
        </div>
      )}

    </div>

    {/* Status panel below the video */}
    <div className="bg-gradient-to-b from-gray-900/70 to-black/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
      {showOrderButton ? (
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Perimeter glow traces */}
            <motion.span
              aria-hidden
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 0.45, ease: 'easeOut', opacity: { duration: 2.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } }}
              style={{ transformOrigin: 'top center' }}
              className="pointer-events-none absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-blue-600/40 via-blue-500/30 to-blue-600/40 blur-md"
            />
            <motion.span
              aria-hidden
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: [0.15, 0.4, 0.15] }}
              transition={{ duration: 0.45, ease: 'easeOut', opacity: { duration: 2.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } }}
              style={{ transformOrigin: 'top center' }}
              className="pointer-events-none absolute -inset-[6px] rounded-3xl bg-gradient-to-r from-blue-700/25 via-blue-600/20 to-blue-700/25 blur-xl"
            />
            <motion.button
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: 1,
              opacity: 1,
              boxShadow: [
                '0 10px 20px rgba(30, 64, 175, 0.2)',
                '0 22px 40px rgba(30, 64, 175, 0.35)'
              ],
            }}
            transition={{
              duration: 0.45,
              ease: 'easeOut',
              boxShadow: { duration: 2.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
            }}
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ transformOrigin: 'top center' }}
            type="button"
            onClick={previewSTL}
              className="relative z-10 px-7 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950 hover:from-blue-900 hover:via-blue-800 hover:to-blue-900 border border-blue-800/60 hover:border-blue-600/70 ring-1 ring-inset ring-blue-400/10 shadow-xl shadow-blue-950/50 transition-all"
          >
            Order Your Gloves
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Fit Score */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-200">
                <Target className="w-4 h-4" />
                <span className="text-sm font-medium">Fit Score</span>
              </div>
              <span className="text-lg font-bold text-white">{Math.round(handFitScore)}%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{handFitScore > 70 ? 'Perfect Fit!' : 'Move closer'}</p>
          </div>

          {/* Calibration */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-200">
                <Ruler className="w-4 h-4" />
                <span className="text-sm font-medium">Calibration</span>
              </div>
              <span className="text-sm font-semibold text-white">{isCalibrated ? 'Calibrated ✓' : 'Calibrating...'}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Factor: {calibrationFactor.toFixed(4)}</p>
          </div>
        </div>
      )}
    </div>

    {/* Progressive Instructions */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-700"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex items-center justify-center w-9 h-9 bg-indigo-900/50 rounded-lg">
          <Settings2 className="w-5 h-5 text-indigo-200" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-medium text-white">Scanning Instructions</h3>
          <p className="text-xs text-gray-400">
            {bothHandsScanned && showOrderButton ? 'Step 3 of 3: Complete ✓' : 'Step 3 of 3: Follow the guided scanning process'}
          </p>
        </div>
      </div>
      
      {/* Dynamic instructions based on scan state */}
      <div className="space-y-3">
        {leftScanCount === 0 && rightScanCount === 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start space-x-3 p-3 bg-indigo-900/30 border border-indigo-700 rounded-lg"
            >
              <Hand className="w-5 h-5 text-indigo-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-indigo-200 font-medium text-sm">Show your LEFT hand first</p>
                <p className="text-indigo-300 text-xs mt-1">Hold it steady in the camera view until the scan completes</p>
              </div>
            </motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start space-x-3 text-xs sm:text-sm text-gray-300">
                <Target className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>Position your hand in the center of the frame</span>
              </div>
              <div className="flex items-start space-x-3 text-xs sm:text-sm text-gray-300">
                <Gauge className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>Wait for fit score to reach 60%+</span>
              </div>
            </div>
          </>
        )}

        {leftScanCount >= 1 && rightScanCount === 0 && !showOrderButton && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start space-x-3 p-3 bg-blue-900/30 border border-blue-700 rounded-lg"
          >
            <Hand className="w-5 h-5 text-blue-300 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-200 font-medium text-sm">Great! Now show your RIGHT hand</p>
              <p className="text-blue-300 text-xs mt-1">Keep it steady until the second scan completes</p>
            </div>
          </motion.div>
        )}

        {bothHandsScanned && showOrderButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start space-x-3 p-3 bg-green-900/30 border border-green-700 rounded-lg"
          >
            <CheckCircle2 className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-green-200 font-medium text-sm">Both hands scanned successfully!</p>
              <p className="text-green-300 text-xs mt-1">Your custom glove measurements are ready - download below!</p>
            </div>
          </motion.div>
        )}

        {/* General tips */}
        <div className="pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">Tips for best results:</p>
          <div className="grid grid-cols-1 gap-2">
            {[
              "Use good lighting and avoid shadows",
              "Keep your hand open with fingers spread",
              "Hold steady when the outline turns green",
              "Make sure your entire hand is visible"
            ].map((tip, index) => (
              <div key={index} className="flex items-start space-x-2 text-xs text-gray-400">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
    {/* STL Viewer Modal */}
    <StlViewerModal
      isOpen={isStlViewerOpen}
      onClose={handleCloseStlViewer}
      stlUrl={stlObjectUrl}
      downloadName={stlDownloadName}
    />
  </div>
)
} 