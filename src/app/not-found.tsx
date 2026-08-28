import Link from 'next/link'

export default function NotFound() {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-8xl font-extrabold text-red-600 mb-4">404</h1>
          <p className="text-white/60 text-lg mb-8">Page not found</p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
          >
            Go Home
          </Link>
        </div>
      </body>
    </html>
  )
}