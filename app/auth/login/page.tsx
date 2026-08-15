import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Inicia sesión</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        Bienvenido de vuelta a VIALII
      </p>
      <LoginForm />
    </div>
  )
}
