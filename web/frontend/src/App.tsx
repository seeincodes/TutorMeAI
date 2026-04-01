import { BrowserRouter, Routes, Route } from 'react-router-dom'

function Home() {
  return (
    <main className="flex h-screen items-center justify-center bg-gray-50">
      <h1 className="text-2xl font-semibold text-gray-900">ChatBridge</h1>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}
