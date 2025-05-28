// app/login/page.js
import LoginForm from '@/components/auth/LoginForm'
import { brandColors } from '@/lib/colors'

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brandColors.gray[50],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <LoginForm />
    </div>
  )
}