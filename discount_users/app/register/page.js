// app/register/page.js
import RegisterForm from '@/components/auth/RegisterForm'
import { brandColors } from '@/lib/colors'

export default function RegisterPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brandColors.gray[50],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <RegisterForm />
    </div>
  )
}