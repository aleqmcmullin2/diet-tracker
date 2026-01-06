import DietTracker from './components/DietTracker'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <DietTracker />
    </AuthProvider>
  )
}

export default App
