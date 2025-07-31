"use client"
import Image from "next/image";
import Navbar from "./components/Navbar";
import Images from "./components/Images";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function Home() {
  const router = useRouter()
  const pricingPlans = [
    {
      name: "Free",
      price: "Rs. 0",
      period: "/forever",
      description: "Perfect for small businesses just getting started",
      features: [
        "Up to 500 items",
        "Basic alerts",
        "Email support",
        "30-day history"
      ],
      buttonText: "Get Started",
      isPopular: false
    },
    {
      name: "Standard",
      price: "Rs.499",
      period: "/month",
      description: "For growing businesses with more inventory needs",
      features: [
        "Unlimited items",
        "Advanced alerts & notifications",
        "Priority support",
        "1-year history",
        "Batch tracking"
      ],
      buttonText: "Get Started",
      isPopular: true
    },
    {
      name: "Pro",
      price: "Rs.999",
      period: "/month",
      description: "Custom solutions for large businesses",
      features: [
        "Everything in Pro",
        "API access",
        "Dedicated account manager",
        "Custom integrations",
        "Advanced analytics"
      ],
      buttonText: "Get Started",
      isPopular: false
    }
  ];

  const faqItems = [
    {
      question: "How does Tracknest keep track of inventory?",
      answer: "Tracknest uses barcode scanning, manual entry, and integrations with point-of-sale systems to accurately track your inventory in real-time."
    },
    {
      question: "Can I use Tracknest for my pharmacy?",
      answer: "Yes! Tracknest is specifically designed to handle the unique requirements of pharmacies, including batch tracking, expiry dates, and medication-specific inventory management."
    },
    {
      question: "Do you offer a free trial?",
      answer: "Yes, we offer a 14-day free trial on all our plans with no credit card required. You can try all features before deciding which plan is right for you."
    },
    {
      question: "Can I upgrade or downgrade my plan later?",
      answer: "Absolutely! You can change your plan at any time, and we'll prorate the difference."
    }
  ];

  return (
    <>
      <Navbar />

      
      <section className="bg-gradient-to-b mt-[90px] from-blue-50 to-white py-20 px-6 md:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Smart Inventory Management <span className="text-blue-600">for All type of businesses</span>
            </h1>
            <p className="text-lg text-gray-600">
              TrackNest empowers businesses—pharmacies, clinics, retail stores, and warehouses—to manage inventory with precision.
              Gain real-time insights, set automated alerts, and access powerful analytics—all from one intuitive platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={(params) => {
                router.push("/login")
              }
              } className="px-6 py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl">
                Start Free Trial
              </button>
              <button className="px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                See How It Works
              </button>
            </div>
          </div>
         <Images/>
        </div>
      </section>

    
      <section className="py-20 px-6 md:px-20 bg-white">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <span className="text-blue-600 font-semibold">FEATURES</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
            Designed for All type of Inventory Needs
          </h2>
          <p className="text-gray-600 mt-4">
            Specialized tools that address the unique challenges of inventory management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: "Expiry Management",
              description: "Automated alerts for soon-to-expire items with batch tracking capabilities."
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ),
              title: "Real-time Analytics",
              description: "Track sales trends, inventory turnover, and predict future needs with AI."
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: "24/7 Monitoring",
              description: "Your inventory is tracked around the clock with instant notifications."
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="p-8 bg-white rounded-xl border border-gray-100 hover:border-blue-100 transition-all hover:shadow-lg"
            >
              <div className="bg-blue-50 p-3 rounded-full w-max mx-auto">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mt-6">{feature.title}</h3>
              <p className="mt-3 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 md:px-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <span className="text-blue-600 font-semibold">PRICING</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 mt-4">
            No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-xl overflow-hidden transition-all hover:shadow-lg ${plan.isPopular ? 'border-2 border-blue-500 shadow-lg' : 'border border-gray-200'
                }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              <div className="p-8 bg-white">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>
                <p className="mt-4 text-gray-600">{plan.description}</p>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="ml-2 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={(params) => {
                  router.push("/login")
                }
                } className={`mt-10 w-full py-3 px-6 rounded-lg font-medium transition-all ${plan.isPopular
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                    : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                  }`}>
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 md:px-20 bg-white">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <span className="text-blue-600 font-semibold">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 mt-4">
            Everything you need to know about Tracknest
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqItems.map((faq, index) => (
            <div key={index} className="group">
              <details className="border-b border-gray-200 pb-4">
                <summary className="flex justify-between items-center py-4 cursor-pointer list-none">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {faq.question}
                  </h3>
                  <svg className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-2 text-gray-600">
                  <p>{faq.answer}</p>
                </div>
              </details>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 md:px-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to transform your inventory management?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join hundreds of businesses who trust Tracknest for their inventory needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
              Start Free Trial
            </button>
            <button className="px-8 py-3 border border-white text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-16 px-6 md:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Tracknest</h3>
            <p className="text-gray-400">
              Smart inventory solutions for All type of businesses.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Updates</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Tutorials</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Tracknest. All rights reserved.
          </p>
          

<Link href="https://vaibhavkhapra.vercel.app" target="_blank" rel="noopener noreferrer">
  Developed by Vaibhav Khapra
</Link>

         
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </>
  );
}