'use client'

import { useState, useEffect } from 'react'
import HandScanner from '@/components/HandScanner'
import MeasurementDisplay from '@/components/MeasurementDisplay'
import Header from '@/components/Header'
import GloveSizeSelector, { GloveSize } from '@/components/GloveSizeSelector'
import SportSelector, { Sport } from '@/components/SportSelector'
import SplashScreen from '@/components/SplashScreen'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)
  const [measurements, setMeasurements] = useState<{
    palmWidth: number
    palmLength: number
    fingerLengths: { [key: string]: number }
    totalHandLength: number
  } | null>(null)

  const [isScanning, setIsScanning] = useState(false)
  const [isCalibrated, setIsCalibrated] = useState(false)
  const [gloveSize, setGloveSize] = useState<GloveSize | null>(null)
  const [showGloveSelector, setShowGloveSelector] = useState(false)
  const [sport, setSport] = useState<Sport | null>(null)
  const [showSportSelector, setShowSportSelector] = useState(false)
  const controls = useAnimation()

  // Handle glove size selection
  const handleGloveSizeSelected = (size: GloveSize) => {
    setGloveSize(size)
    setShowGloveSelector(false)
    setIsCalibrated(false) // Reset calibration when size changes
    setShowSportSelector(true)
  }

  const handleSportSelected = (selectedSport: Sport) => {
    setSport(selectedSport)
    setShowSportSelector(false)
    // Auto-start camera after both glove size and sport are selected
    setIsScanning(true)
  }

  // Idle animation for the accent line
  useEffect(() => {
    const animate = async () => {
      await controls.start({
        width: ['0%', '100%', '0%'],
        left: ['0%', '0%', '100%'],
        transition: { duration: 4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2 }
      })
    }
    animate()
  }, [controls])

  return (
    <>
      {/* Splash Screen - Shows FIRST before anything else */}
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen 
            onComplete={() => {
              setShowSplash(false)
              setShowGloveSelector(true) // Only show glove selector AFTER splash completes
            }} 
            duration={3000}
          />
        )}
      </AnimatePresence>

      <main className="min-h-screen">
        {/* Header - fades in after splash screen completes */}
        <AnimatePresence>
          {!showSplash && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <Header />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Glove Size Selector Modal */}
        <AnimatePresence>
          {showGloveSelector && (
            <GloveSizeSelector
              onSizeSelected={handleGloveSizeSelected}
              isVisible={showGloveSelector}
            />
          )}
        </AnimatePresence>

      {/* Sport Selector Modal */}
      <AnimatePresence>
        {showSportSelector && (
          <SportSelector
            isVisible={showSportSelector}
            onSportSelected={handleSportSelected}
          />
        )}
      </AnimatePresence>
      
      <div className={`container mx-auto px-4 ${isScanning ? 'py-2 pb-8 sm:py-16' : 'py-4 sm:py-6'}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className={`text-center relative ${isScanning ? 'hidden sm:block sm:mb-8' : 'mb-4 sm:mb-6'}`}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 -top-[60px] sm:-top-[100px] -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] sm:w-[600px] sm:h-[600px] bg-gradient-to-r from-gray-900/50 to-black rounded-full blur-3xl"></div>
          </div>

          {/* Welcome and Instructions */}
          {!gloveSize && !sport && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-4 bg-gradient-to-b from-gray-900/70 to-black/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 max-w-2xl mx-auto"
            >
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome</h2>
                <p className="text-gray-300 text-sm sm:text-base">Get perfect-fitting sports gloves with AI-powered hand scanning</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Select Your Glove Size</h3>
                    <p className="text-gray-400 text-sm">Choose your approximate glove size to calibrate the scanning system</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Choose Your Sport</h3>
                    <p className="text-gray-400 text-sm">Tell us what sport you're buying gloves for to get optimized guidance</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Scan Your Hands & Get Your Gloves</h3>
                    <p className="text-gray-400 text-sm">Follow the guided scanning process to measure both hands accurately, then download your personalized 3D model</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">💡</span>
                  </div>
                  <h4 className="text-blue-200 font-semibold text-sm">Pro Tips</h4>
                </div>
                <ul className="text-blue-100 text-xs sm:text-sm space-y-1">
                  <li>• Use good lighting for best results</li>
                  <li>• Keep your hand steady during scanning</li>
                  <li>• Make sure your entire hand is visible in the frame</li>
                  <li>• Follow the on-screen guidance for optimal positioning</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Glove Size Display - hidden on mobile when scanning */}
          {(gloveSize || sport) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`mt-2 flex items-center justify-center gap-2 flex-wrap ${isScanning ? 'hidden sm:flex' : ''}`}
            >
              {gloveSize && (
                <button
                  onClick={() => setShowGloveSelector(true)}
                  className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-gray-700 hover:border-indigo-500 transition-colors"
                >
                  Glove Size: {gloveSize}
                </button>
              )}
              {sport ? (
                <button
                  onClick={() => setShowSportSelector(true)}
                  className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-gray-700 hover:border-cyan-500 transition-colors"
                >
                  Sport: {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </button>
              ) : (
                <button
                  onClick={() => setShowSportSelector(true)}
                  className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-gray-700 hover:border-cyan-500 transition-colors"
                >
                  Select Sport
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto relative">
          {/* Background accent */}
          <div className="hidden md:block absolute inset-0 -z-10 bg-gradient-to-b from-gray-900/20 to-black/20 backdrop-blur-3xl rounded-3xl"></div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-2 sm:p-6 lg:p-8 border border-white/10"
          >
            <HandScanner 
              onMeasurementsUpdate={setMeasurements}
              isScanning={isScanning}
              setIsScanning={setIsScanning}
              onCalibrationChange={setIsCalibrated}
              gloveSize={gloveSize}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="col-span-1 bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6 lg:p-8 border border-white/10"
          >
            <MeasurementDisplay measurements={measurements} isCalibrated={isCalibrated} />
          </motion.div>
        </div>
      </div>
    </main>
    </>
  )
} 