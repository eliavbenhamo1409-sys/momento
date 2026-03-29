import { AnimatePresence } from 'motion/react'
import { motion } from 'motion/react'
import PageTransition from '../components/shared/PageTransition'
import ProductLayout from '../components/layout/ProductLayout'
import UploadDropzone from '../components/upload/UploadDropzone'
import UploadProgress from '../components/upload/UploadProgress'
import UploadComplete from '../components/upload/UploadComplete'
import { useAlbumStore } from '../store/albumStore'

export default function UploadScreen() {
  const { isUploading, isUploadComplete } = useAlbumStore()

  return (
    <PageTransition>
      <ProductLayout currentStep="upload">
        <div className="h-full flex flex-col items-center justify-center px-6 -mt-[3%]">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl md:text-4xl font-light text-center mb-3"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            בוא נתחיל
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-secondary text-center mb-10 max-w-md"
          >
            העלה את התמונות שלך ואנחנו נדאג לכל השאר
          </motion.p>

          <AnimatePresence mode="wait">
            {isUploadComplete ? (
              <UploadComplete key="complete" />
            ) : isUploading ? (
              <UploadProgress key="progress" />
            ) : (
              <UploadDropzone key="dropzone" />
            )}
          </AnimatePresence>
        </div>
      </ProductLayout>
    </PageTransition>
  )
}
