'use client'

import { motion } from 'framer-motion'
import { Ruler, Hand, Fingerprint, TrendingUp, ThumbsUp, ArrowUpFromDot, Hand as MiddleFinger, CircleDot, Minimize2, CheckCircle2 } from 'lucide-react'

interface MeasurementDisplayProps {
  measurements: {
    palmWidth: number
    palmLength: number
    fingerLengths: { [key: string]: number }
    totalHandLength: number
  } | null
  isCalibrated?: boolean
}

export default function MeasurementDisplay({ measurements, isCalibrated = false }: MeasurementDisplayProps) {
  if (!measurements) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-gray-800 rounded-lg">
            <Ruler className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Measurements</h2>
            <p className="text-xs sm:text-sm text-gray-400">No data available</p>
          </div>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-5 sm:p-8 text-center border border-gray-700">
          <Hand className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-300">Position your hand in front of the camera to see measurements</p>
          {!isCalibrated && (
            <div className="mt-3 sm:mt-4 p-3 bg-blue-900/50 backdrop-blur-sm border border-blue-700 rounded-lg">
              <p className="text-blue-200 text-xs sm:text-sm">
                ℹ️ Select your glove size to begin calibration.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const formatMeasurement = (value: number) => {
    return `${value.toFixed(1)} cm`
  }

  const getFingerIcon = (fingerName: string) => {
    switch (fingerName) {
      case 'thumb': return <ThumbsUp className="w-4 h-4" />
      case 'index': return <ArrowUpFromDot className="w-4 h-4" />
      case 'middle': return <MiddleFinger className="w-4 h-4" />
      case 'ring': return <CircleDot className="w-4 h-4" />
      case 'pinky': return <Minimize2 className="w-4 h-4" />
      default: return <Hand className="w-4 h-4" />
    }
  }

  const getFingerColor = (fingerName: string) => {
    return 'bg-blue-900/50 text-blue-200'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-indigo-900/50 rounded-lg">
          <Ruler className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-200" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Measurements</h2>
          <p className="text-xs sm:text-sm text-gray-400">Real-time hand dimensions</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        {/* Palm Measurements */}
        <div className="bg-gradient-to-r from-gray-800/50 to-indigo-900/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-gray-700">
          <div className="flex items-center space-x-2 mb-2 sm:mb-3">
            <Hand className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-200" />
            <h3 className="text-sm sm:text-base font-semibold text-indigo-200">Palm Dimensions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
              <p className="text-xs sm:text-sm text-gray-400">Width</p>
              <p className="text-lg sm:text-xl font-bold text-indigo-200">{formatMeasurement(measurements.palmWidth)}</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
              <p className="text-xs sm:text-sm text-gray-400">Length</p>
              <p className="text-lg sm:text-xl font-bold text-indigo-200">{formatMeasurement(measurements.palmLength)}</p>
            </div>
          </div>
        </div>

        {/* Finger Measurements */}
        <div className="bg-gradient-to-r from-gray-800/50 to-blue-900/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-gray-700">
          <div className="flex items-center space-x-2 mb-2 sm:mb-3">
            <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 text-blue-200" />
            <h3 className="text-sm sm:text-base font-semibold text-blue-200">Finger Lengths</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(measurements.fingerLengths).map(([finger, length]) => (
              <motion.div
                key={finger}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * Object.keys(measurements.fingerLengths).indexOf(finger) }}
                className="flex items-center justify-between bg-gray-800/50 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 border border-gray-700"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base sm:text-lg">{getFingerIcon(finger)}</span>
                  <span className="text-sm sm:text-base font-medium text-gray-200 capitalize">{finger}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${getFingerColor(finger)}`}>
                  {formatMeasurement(length)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Total Hand Length */}
        <div className="bg-gradient-to-r from-gray-800/50 to-purple-900/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-gray-700">
          <div className="flex items-center space-x-2 mb-2 sm:mb-3">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-200" />
            <h3 className="text-sm sm:text-base font-semibold text-purple-200">Total Hand Length</h3>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-gray-700">
            <p className="text-2xl sm:text-3xl font-bold text-purple-200 text-center">
              {formatMeasurement(measurements.totalHandLength)}
            </p>
            <p className="text-xs sm:text-sm text-gray-400 text-center mt-1">Wrist to middle finger tip</p>
          </div>
        </div>

        {/* Measurement completion indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-green-700"
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-green-200">Measurements Ready</h3>
          </div>
          <p className="text-green-100 text-xs sm:text-sm">
            Your hand has been measured accurately. Complete both hand scans to download your custom glove model.
          </p>
          
          <div className="mt-3 p-2 bg-green-800/30 border border-green-600 rounded-lg">
            <p className="text-green-200 text-xs">
              <span className="font-semibold">Next:</span> Follow the scanning instructions to measure your other hand
            </p>
          </div>
        </motion.div>

      </motion.div>
    </div>
  )
} 