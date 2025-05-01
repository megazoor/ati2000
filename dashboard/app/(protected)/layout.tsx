'use client'

import AuthGuard from '../components/AuthGuard'
import Navigation from '../components/Navigation'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-grow">
          {children}
        </div>
        <footer className="bg-white dark:bg-secondary-800 border-t border-secondary-200 dark:border-secondary-700 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-secondary-600 dark:text-secondary-400">
              AdvancedTraderAI &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </AuthGuard>
  )
}