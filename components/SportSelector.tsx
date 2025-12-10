'use client'

import { motion } from 'framer-motion'
import { Check, ChevronRight } from 'lucide-react'

export type Sport = 'football' | 'baseball' | 'golf' | 'lacrosse'

interface SportSelectorProps {
  isVisible: boolean
  onSportSelected: (sport: Sport) => void
}

const SPORTS: { key: Sport; label: string; description: string; details: string }[] = [
  { 
    key: 'football', 
    label: 'Football', 
    description: 'Receiver/RB gloves',
    details: 'Optimized for grip and dexterity during catches and ball handling'
  },
  { 
    key: 'baseball', 
    label: 'Baseball', 
    description: 'Batting gloves',
    details: 'Focus on palm comfort and wrist flexibility for better grip and swing'
  },
  { 
    key: 'golf', 
    label: 'Golf', 
    description: 'Golf glove fit',
    details: 'Precise sizing for consistent grip pressure and club control'
  },
  { 
    key: 'lacrosse', 
    label: 'Lacrosse', 
    description: 'Lacrosse gloves',
    details: 'Balance of protection and dexterity for stick handling and shooting'
  },
]

export default function SportSelector({ isVisible, onSportSelected }: SportSelectorProps) {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.45 }}
        className="bg-gradient-to-b from-gray-900 to-black rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-lg border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-indigo-900/50 rounded-full mx-auto mb-3">
            <Check className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-200" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">What sport is this for?</h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">We'll customize the scanning process and glove recommendations for your specific sport.</p>
          
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-200 text-xs sm:text-sm">
              <span className="font-semibold">Step 2 of 3:</span> Each sport has unique fit requirements. Select your sport for optimized measurements.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {SPORTS.map(({ key, label, description, details }) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSportSelected(key)}
              className="group flex items-center justify-between bg-gradient-to-b from-gray-800/50 to-gray-900/50 hover:from-indigo-800/40 hover:to-indigo-900/40 backdrop-blur-sm rounded-lg p-4 border border-gray-700 hover:border-indigo-500 transition-all"
            >
              <div className="text-left flex-1">
                <div className="text-white font-semibold text-base mb-1">{label}</div>
                <div className="text-gray-400 text-xs mb-2">{description}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{details}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity ml-3 flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}


