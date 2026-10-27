import Navbar from './components/Navbar'
import Hero from './components/Hero'
import TheChallenge from './components/TheChallenge'
import OurData from './components/OurData'
import IntelligencePipeline from './components/IntelligencePipeline'
import Features from './components/Features'
import RoleShowcase from './components/RoleShowcase'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen overflow-x-clip bg-page">
      <Navbar />
      <Hero />
      <TheChallenge />
      <OurData />
      <IntelligencePipeline />
      <Features />
      <RoleShowcase />
      <CallToAction />
      <Footer />
    </div>
  )
}
