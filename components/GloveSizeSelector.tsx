'use client'

import { motion } from 'framer-motion'
import { Hand, ArrowRight, Check } from 'lucide-react'

// Glove size measurements - converted from circumference to width
const GLOVE_SIZES = {
  S: {
    name: 'Small',
    palmWidth: 6.24, // 19.6cm circumference ÷ π ≈ 6.24cm width
    measurements: {
      thumb: 7.1,
      index: 5.2,
      middle: 5.3,
      ring: 5.1,
      pinky: 4.3
    }
  },
  M: {
    name: 'Medium', 
    palmWidth: 6.46, // 20.3cm circumference ÷ π ≈ 6.46cm width
    measurements: {
      thumb: 7.3,
      index: 5.4,
      middle: 5.5,
      ring: 5.3,
      pinky: 4.4
    }
  },
  L: {
    name: 'Large',
    palmWidth: 6.69, // 21.0cm circumference ÷ π ≈ 6.69cm width
    measurements: {
      thumb: 7.6,
      index: 5.6,
      middle: 5.7,
      ring: 5.5,
      pinky: 4.6
    }
  },
  XL: {
    name: 'X-Large',
    palmWidth: 6.91, // 21.7cm circumference ÷ π ≈ 6.91cm width
    measurements: {
      thumb: 7.8,
      index: 5.8,
      middle: 5.9,
      ring: 5.7,
      pinky: 4.7
    }
  },
  '2XL': {
    name: '2X-Large',
    palmWidth: 7.13, // 22.4cm circumference ÷ π ≈ 7.13cm width
    measurements: {
      thumb: 8.0,
      index: 6.0,
      middle: 6.1,
      ring: 5.8,
      pinky: 4.9
    }
  },
  '3XL': {
    name: '3X-Large',
    palmWidth: 7.36, // 23.1cm circumference ÷ π ≈ 7.36cm width
    measurements: {
      thumb: 8.3,
      index: 6.2,
      middle: 6.3,
      ring: 6.0,
      pinky: 5.0
    }
  }
} as const

export type GloveSize = keyof typeof GLOVE_SIZES

interface GloveSizeSelectorProps {
  onSizeSelected: (size: GloveSize) => void
  isVisible: boolean
}

export default function GloveSizeSelector({ onSizeSelected, isVisible }: GloveSizeSelectorProps) {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-gradient-to-b from-gray-900 to-black rounded-xl sm:rounded-2xl p-4 sm:p-8 max-w-2xl w-full border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-indigo-900/50 rounded-full mx-auto mb-3 sm:mb-4">
            <Hand className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-200" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Select Your Glove Size</h2>
          
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-200 text-xs sm:text-sm">
              <span className="font-semibold">Step 1 of 3:</span> Select the size you've worn before. We'll capture your exact measurements next to craft custom gloves made just for you.
            </p>
          </div>
        </div>

        {/* Size Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {Object.entries(GLOVE_SIZES).map(([size, data]) => (
            <motion.button
              key={size}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSizeSelected(size as GloveSize)}
              className="group bg-gradient-to-b from-gray-800/50 to-gray-900/50 hover:from-indigo-800/50 hover:to-indigo-900/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700 hover:border-indigo-500 transition-all duration-300"
            >
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">{size}</div>
                <div className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">{data.name}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 space-y-1">
                  <div>Palm: {data.palmWidth.toFixed(1)}cm</div>
                  <div>Thumb: {data.measurements.thumb}cm</div>
                </div>
              </div>
              <div className="flex items-center justify-center mt-3 sm:mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Info */}
        <div className="space-y-3">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-gray-700">
            <div className="flex items-start space-x-3">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-gray-300">
                <p className="font-medium mb-1">How to choose your size:</p>
                <p>Select the glove size that fits you best. This will calibrate the system to provide accurate measurements based on standard glove sizing.</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <span className="text-amber-400 text-sm mt-0.5">💡</span>
              <div className="text-xs sm:text-sm text-amber-200">
                <p className="font-medium mb-1">Not sure about your size?</p>
                <p>Choose the closest option. The AI scanning will provide precise measurements regardless of your initial selection.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export { GLOVE_SIZES } 