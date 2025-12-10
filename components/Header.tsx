'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import armalogo from './armalogo.png'

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50 h-14 sm:h-16">
      <div className="container mx-auto h-full px-3">
        <div className="flex items-center justify-center h-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-32 h-10 sm:w-40 sm:h-14"
          >
            <Image
              src={armalogo}
              alt="ArmaScan Logo"
              fill
              className="object-contain"
              priority
            />
          </motion.div>
        </div>
      </div>
    </header>
  )
} 