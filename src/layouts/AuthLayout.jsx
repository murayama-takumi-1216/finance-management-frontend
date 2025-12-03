import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div
        className="hidden lg:flex lg:w-1/2 w-full justify-center relative overflow-hidden"
        style={{
          backgroundImage: 'url(/background.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            <span className="text-3xl font-bold text-white">Finance Manager</span>
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
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              <span className="text-2xl font-bold text-gray-900">Finance Manager</span>
            </div>
            <p className="text-gray-500">Administra tus finanzas con facilidad</p>
          </div>

          <Outlet />

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            &copy; {new Date().getFullYear()} Finance Manager. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
