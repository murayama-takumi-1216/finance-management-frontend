import { Outlet } from 'react-router-dom';
import { SparklesIcon, ChartBarIcon, CurrencyDollarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl" />

        {/* Floating icons */}
        <div className="absolute top-32 right-24 p-4 bg-white/10 backdrop-blur-sm rounded-2xl animate-bounce" style={{ animationDuration: '3s' }}>
          <ChartBarIcon className="w-8 h-8 text-white" />
        </div>
        <div className="absolute bottom-40 left-24 p-4 bg-white/10 backdrop-blur-sm rounded-2xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <CurrencyDollarIcon className="w-8 h-8 text-white" />
        </div>
        <div className="absolute top-1/2 right-32 p-4 bg-white/10 backdrop-blur-sm rounded-2xl animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
          <ShieldCheckIcon className="w-8 h-8 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">Finance Pro</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Toma el control de tu<br />
            <span className="text-indigo-200">futuro financiero</span>
          </h1>

          <p className="text-lg text-indigo-100 mb-10 max-w-md">
            Rastrea gastos, administra cuentas y obtén información sobre tus hábitos de gasto con nuestra poderosa plataforma de gestión financiera.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              { title: 'Análisis Inteligente', desc: 'Visualiza tus finanzas con hermosos gráficos' },
              { title: 'Múltiples Cuentas', desc: 'Administra cuentas personales, de negocios y compartidas' },
              { title: 'Seguro y Privado', desc: 'Tus datos están encriptados y protegidos' },
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">{feature.title}</p>
                  <p className="text-sm text-indigo-200">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Finance Pro</span>
            </div>
            <p className="text-gray-500">Administra tus finanzas con facilidad</p>
          </div>

          <Outlet />

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            &copy; {new Date().getFullYear()} Finance Pro. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
