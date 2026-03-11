'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Check, Zap, Shield, Users, Gauge, Sparkles, ArrowUpRight } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Home() {
  const mainRef = useRef(null)
  const footerRef = useRef(null)
  const [isScrolled, setIsScrolled] = useState(false)

  // Track if footer is visible in the viewport using framer-motion's useInView
  // Small margin ensures it triggers just as the footer begins to appear
  const isFooterVisible = useInView(footerRef, { margin: "0px 0px -50px 0px" })

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Features Animation
      gsap.from('.feature-card', {
        scrollTrigger: {
          trigger: '#features',
          start: 'top 80%',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out'
      })

      // Architecture Animation
      gsap.from('.architecture-content', {
        scrollTrigger: {
          trigger: '#architecture',
          start: 'top 75%',
        },
        y: 30,
        opacity: 0,
        duration: 1,
        ease: 'power2.out'
      })

      // How It Works Animation
      gsap.from('.step-card', {
        scrollTrigger: {
          trigger: '#how-it-works',
          start: 'top 75%',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'back.out(1.7)'
      })

      // Dashboard Preview Animation
      gsap.from('.dashboard-preview', {
        scrollTrigger: {
          trigger: '.dashboard-section',
          start: 'top 70%',
        },
        scale: 0.95,
        opacity: 0,
        duration: 1,
        ease: 'power2.out'
      })

      // Integrations Animation
      gsap.from('.integration-item', {
        scrollTrigger: {
          trigger: '.integrations-section',
          start: 'top 80%',
        },
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        stagger: {
          amount: 0.8,
          grid: [2, 5],
          from: 'center'
        },
        ease: 'back.out(1.7)'
      })
    }, mainRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={mainRef} className="min-h-screen bg-background text-foreground dark">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-x-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* Navigation */}
      <motion.nav
        className={`fixed w-full top-0 z-50 transition-colors duration-500 ${isScrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border/50' : 'bg-transparent border-transparent'} py-4`}
        initial={{ y: -100 }}
        animate={{ y: isFooterVisible ? -100 : 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1 }}
      >
        <motion.div
          className="mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full"
          initial={{ maxWidth: '1280px', opacity: 0 }}
          animate={{
            opacity: isFooterVisible ? 0 : 1, // Fade out when footer is visible
            maxWidth: isScrolled ? '896px' : '1280px',
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            mass: 1
          }}
        >
          <div className="text-4xl font-bold">
            <span className="text-primary">Axerra</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground/70 hover:text-primary transition text-sm font-medium">Features</a>
            <a href="#how-it-works" className="text-foreground/70 hover:text-primary transition text-sm font-medium">How It Works</a>
            <a href="#architecture" className="text-foreground/70 hover:text-primary transition text-sm font-medium">Technology</a>
            <a href="#benefits" className="text-foreground/70 hover:text-primary transition text-sm font-medium">Benefits</a>
          </div>
          <Link href="/login">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
              Get Started
            </Button>
          </Link>
        </motion.div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/assets/Dark_dashboard.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-0"></div>
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background to-transparent z-10"></div>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-10"
            >
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/15 text-secondary rounded-full text-xs font-semibold border border-secondary/30 backdrop-blur-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  Enterprise Identity Automation
                </motion.div>
                <h1 className="text-6xl lg:text-7xl font-bold text-balance leading-tight">
                  Automate <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-secondary">Identity</span> at Scale
                </h1>
                <p className="text-lg text-foreground/70 text-balance leading-relaxed max-w-lg">
                  Streamline user provisioning and access management with enterprise-grade SCIM integration. Secure, fast, and infinitely scalable.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base font-semibold h-auto shadow-lg shadow-primary/20">
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" className="w-full sm:w-auto border-border/50 hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-full px-8 py-6 text-base font-semibold h-auto backdrop-blur-sm bg-transparent">
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold text-primary">
                      {i}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Join 1000+ teams</p>
                  <p className="text-xs text-foreground/60">Automating identity at scale</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 text-balance">
              Enterprise-Grade <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Features</span>
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Everything you need to manage identities securely and efficiently at scale
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: 'User Provisioning',
                description: 'Automatic user creation and onboarding across all connected applications in minutes.',
                color: 'from-primary to-blue-500'
              },
              {
                icon: Shield,
                title: 'SCIM Protocol',
                description: 'Industry-standard SCIM 2.0 integration for seamless compatibility with enterprise systems.',
                color: 'from-secondary to-cyan-500'
              },
              {
                icon: Zap,
                title: 'Real-Time Sync',
                description: 'Instant identity synchronization across all platforms ensuring data consistency.',
                color: 'from-primary to-secondary'
              },
              {
                icon: Gauge,
                title: 'Advanced Monitoring',
                description: 'Comprehensive dashboards and real-time monitoring of all identity operations.',
                color: 'from-blue-500 to-primary'
              },
              {
                icon: Check,
                title: 'Compliance Ready',
                description: 'Built-in controls for SOC2, GDPR, and enterprise security requirements.',
                color: 'from-secondary to-cyan-500'
              },
              {
                icon: Shield,
                title: 'Access Control',
                description: 'Fine-grained access policies with role-based and attribute-based control.',
                color: 'from-primary to-blue-500'
              }
            ].map((feature, i) => {
              const IconComponent = feature.icon
              return (
                <div key={i} className="group relative feature-card">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition duration-300`}></div>
                  <div className="relative p-8 border border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm hover:border-border/80 transition duration-300 h-full hover:shadow-lg hover:shadow-primary/10">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-6`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-foreground/70 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10 architecture-content">
          <div className="space-y-16">
            <div className="text-center">
              <h2 className="text-5xl lg:text-6xl font-bold mb-6 text-balance">
                Built on <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Enterprise</span> Principles
              </h2>
              <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                Scalability, security, and reliability built into every layer
              </p>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-border/50 backdrop-blur-sm">
                <Image
                  src="https://placehold.co/1200x800/png?text=Architecture+Diagram"
                  alt="Axerra architecture diagram showing identity provider, SCIM gateway, and integrated applications"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 text-balance">
              Simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Integration</span>
            </h2>
            <p className="text-lg text-foreground/70">Get up and running in minutes, not days</p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary opacity-20"></div>

            {[
              {
                step: '01',
                title: 'Connect',
                description: 'Integrate Axerra with your identity provider using SCIM protocol'
              },
              {
                step: '02',
                title: 'Configure',
                description: 'Map identity attributes and define access policies for your applications'
              },
              {
                step: '03',
                title: 'Automate',
                description: 'Enable automatic user provisioning and access management workflows'
              },
              {
                step: '04',
                title: 'Monitor',
                description: 'Track all identity operations with comprehensive audit logs and analytics'
              }
            ].map((item, i) => (
              <div key={i} className="relative step-card">
                <div className="relative z-10 mb-8 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
                    {item.step}
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 dashboard-section">
        <div className="max-w-7xl mx-auto space-y-12 relative z-10">
          <div className="text-center">
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 text-balance">
              Powerful <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Dashboard</span>
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Monitor, manage, and control all identity operations from a single elegant interface
            </p>
          </div>
          <div className="group relative dashboard-preview">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-border/50 backdrop-blur-sm">
              <Image
                src="https://placehold.co/1200x800/png?text=Dashboard+Mockup"
                alt="Axerra dashboard showing user management, sync status, and integration overview"
                fill
                className="object-cover group-hover:scale-105 transition duration-500"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-5xl lg:text-6xl font-bold text-balance">
                Benefits for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Enterprise IT</span>
              </h2>
              <div className="space-y-4">
                {[
                  { title: 'Reduce Onboarding Time', description: 'From weeks to minutes with automated user provisioning' },
                  { title: 'Improve Security', description: 'Consistent access policies and instant revocation across all apps' },
                  { title: 'Lower Costs', description: 'Reduce manual identity management overhead by up to 70%' },
                  { title: 'Ensure Compliance', description: 'Automated audit trails and compliance reporting built-in' },
                  { title: 'Increase Productivity', description: 'IT teams focus on strategic projects, not routine access requests' }
                ].map((benefit, i) => (
                  <div key={i} className="flex gap-4 group p-4 rounded-xl hover:bg-card/50 transition duration-200">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-primary/30">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition">{benefit.title}</h3>
                      <p className="text-foreground/70 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { number: '70%', label: 'Faster Onboarding', color: 'from-primary to-blue-500' },
                { number: '99.9%', label: 'Uptime SLA', color: 'from-secondary to-cyan-500' },
                { number: '500+', label: 'Integrations', color: 'from-primary to-secondary' },
                { number: '24/7', label: 'Expert Support', color: 'from-blue-500 to-primary' }
              ].map((stat, i) => (
                <div key={i} className="group relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 rounded-2xl transition duration-300`}></div>
                  <div className="relative p-6 border border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm hover:border-border/80 transition duration-300">
                    <div className={`text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${stat.color} mb-3`}>
                      {stat.number}
                    </div>
                    <p className="text-foreground/70 text-sm font-medium">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 integrations-section">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 text-balance">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">500+</span> Integrations Ready
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Connect with your entire application ecosystem and manage identities across all platforms
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {['Okta', 'Azure AD', 'Ping', 'Salesforce', 'ServiceNow', 'Workday', 'Active Directory', 'Google Workspace', 'GitHub', 'Slack'].map((app, i) => (
              <div key={i} className="group relative integration-item">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 rounded-xl blur transition duration-300"></div>
                <div className="relative flex items-center justify-center p-6 border border-border/50 rounded-xl bg-card/30 backdrop-blur-sm hover:border-border/80 transition duration-300 group-hover:shadow-lg group-hover:shadow-primary/10">
                  <span className="font-semibold text-foreground text-sm">{app}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-foreground/50 text-sm mt-12">
            and many more... Don't see what you need? <span className="text-primary hover:underline cursor-pointer">Build a custom connector</span>
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 mb-20 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative group rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-primary/20">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 opacity-0 group-hover:opacity-100 blur-2xl transition duration-500"></div>
            <div className="relative border border-border/50 group-hover:border-primary/50 rounded-3xl backdrop-blur-sm bg-gradient-to-br from-card/50 via-background/50 to-card/50 p-12 text-center space-y-8 transition-colors duration-300">
              <div>
                <h2 className="text-5xl lg:text-6xl font-bold mb-6 text-balance">
                  Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Automate</span>?
                </h2>
                <p className="text-lg text-foreground/70 mb-2">
                  Join hundreds of enterprises automating identity at scale
                </p>
                <p className="text-sm text-foreground/50">
                  14-day free trial. No credit card required.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 w-full">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 rounded-full px-8 py-6 text-base font-semibold h-auto shadow-lg shadow-primary/30">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" className="w-full sm:w-auto border-border/50 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-full px-8 py-6 text-base font-semibold h-auto backdrop-blur-sm bg-transparent">
                  Schedule Demo <ArrowUpRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerRef} className="relative border-t border-border/50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-1 sm:gap-8 md:gap-12 mb-12 text-center justify-items-center max-w-4xl mx-auto">
            <div className="w-full">
              <h3 className="font-bold text-foreground text-xs sm:text-base mb-3 sm:mb-6">Product</h3>
              <ul className="space-y-2 sm:space-y-3 text-foreground/70 text-[10px] sm:text-sm">
                <li><a href="#" className="hover:text-primary transition duration-200">Features</a></li>
                <li><a href="#" className="hover:text-primary transition duration-200">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition duration-200">Security</a></li>
                <li><a href="#" className="hover:text-primary transition duration-200">Compliance</a></li>
              </ul>
            </div>
            <div className="w-full">
              <h3 className="font-bold text-foreground text-xs sm:text-base mb-3 sm:mb-6">Company</h3>
              <ul className="space-y-2 sm:space-y-3 text-foreground/70 text-[10px] sm:text-sm">
                <li><a href="#" className="hover:text-primary transition duration-200">About</a></li>
                <li><a href="#" className="hover:text-primary transition duration-200">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition duration-200">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition duration-200">Contact</a></li>
              </ul>
            </div>
            <div className="w-full">
              <h3 className="font-bold text-foreground text-xs sm:text-base mb-3 sm:mb-6">Resources</h3>
              <ul className="space-y-2 sm:space-y-3 text-foreground/70 text-[10px] sm:text-sm">
                <li><a href="#" className="hover:text-primary transition duration-200">Docs</a></li>
                <li><a href="#" className="hover:text-primary transition duration-200">API</a></li>
                <li><a href="#" className="hover:text-primary transition duration-200">Support</a></li>
                <li><a href="#" className="hover:text-primary transition duration-200">Community</a></li>
              </ul>
            </div>
            <div className="w-full">
              <h3 className="font-bold text-foreground text-xs sm:text-base mb-3 sm:mb-6">Legal</h3>
              <ul className="space-y-2 sm:space-y-3 text-foreground/70 text-[10px] sm:text-sm">
                <li><a href="#" className="hover:text-primary transition duration-200">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition duration-200">Terms</a></li>
                <li><a href="#" className="hover:text-primary transition duration-200">Security</a></li>
                <li><a href="#" className="hover:text-primary transition duration-200">DPA</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-16 pb-8 flex flex-col w-full">
            <div className="flex flex-col items-center justify-center w-full overflow-hidden mb-12">
              <div className="text-[25vw] font-bold tracking-tighter leading-[0.8] select-none text-center">
                <span className="text-primary opacity-30">Axerra</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left w-full">
              <div>
                <p className="text-foreground/50 text-sm font-medium">
                  Enterprise Identity Automation Platform
                </p>
              </div>
              <p className="text-foreground/40 text-xs">
                © {new Date().getFullYear()} Axerra. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
