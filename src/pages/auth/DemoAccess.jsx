import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function DemoAccess() {
  const { demoAccess } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function startDemo() {
      await demoAccess()
      navigate('/')
    }
    startDemo()
  }, [demoAccess, navigate])

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Demo access</h2>
        <p>Loading the demo dashboard for Evolve Robotics...</p>
      </div>
    </div>
  )
}
