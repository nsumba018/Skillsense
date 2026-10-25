import Navbar from './components/Navbar'
import Hero from './components/Hero'
import StatisticsStrip from './components/StatisticsStrip'
import Features from './components/Features'
import RootedInRwanda from './components/RootedInRwanda'
import EducationLaborMismatch from './components/EducationLaborMismatch'
import RoleShowcase from './components/RoleShowcase'
import IntelligencePipeline from './components/IntelligencePipeline'
import QuoteSection from './components/QuoteSection'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen overflow-x-clip bg-page">
      <Navbar />
      <Hero />
      <StatisticsStrip />
      <Features />
      <RootedInRwanda />
      <EducationLaborMismatch />
      <RoleShowcase />
      <IntelligencePipeline />
      <QuoteSection />
      <CallToAction />
      <Footer />
    </div>
  )
}
