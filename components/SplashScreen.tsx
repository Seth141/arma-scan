'use client'

import { useEffect, useRef } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import { motion } from 'framer-motion'
import animationData from './animation.json'

interface SplashScreenProps {
  onComplete: () => void
  duration?: number
}

export default function SplashScreen({ onComplete, duration = 3000 }: SplashScreenProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null)

  useEffect(() => {
    // Auto-complete after duration
    const timer = setTimeout(() => {
      onComplete()
    }, duration)

    return () => clearTimeout(timer)
  }, [onComplete, duration])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Pure black background - no gradients or edges */}
      <div className="absolute inset-0" style={{ backgroundColor: '#000000' }} />
      
      {/* Lottie animation container - no borders or backgrounds */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10"
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: '300px', height: '300px' }}
          className="sm:!w-[400px] sm:!h-[400px] lg:!w-[500px] lg:!h-[500px]"
        />
      </motion.div>
    </motion.div>
  )
}

