import TopBar from './components/TopBar'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import StatisticsStrip from './components/StatisticsStrip'
import EducationLaborMismatch from './components/EducationLaborMismatch'
import StakeholderSection from './components/StakeholderSection'
import IntelligencePipeline from './components/IntelligencePipeline'
import QuoteSection from './components/QuoteSection'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-page">
      <TopBar />
      <Navbar />
      <Hero />
      <StatisticsStrip />
      <EducationLaborMismatch />
      <StakeholderSection />
      <IntelligencePipeline />
      <QuoteSection />
      <CallToAction />
      <Footer />
    </div>
  )
}
