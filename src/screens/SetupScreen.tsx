import PageTransition from '../components/shared/PageTransition'
import ProductLayout from '../components/layout/ProductLayout'
import QuestionFlow from '../components/setup/QuestionFlow'
import LivePreview from '../components/setup/LivePreview'

export default function SetupScreen() {
  return (
    <PageTransition>
      <ProductLayout currentStep="setup" showBack backTo="/configure" backLabel="חזרה למפרט">
        <div className="h-full flex">
          <div className="flex-[55] px-12 py-8 flex flex-col justify-center">
            <QuestionFlow />
          </div>
          <div className="flex-[45] p-6">
            <LivePreview />
          </div>
        </div>
      </ProductLayout>
    </PageTransition>
  )
}
