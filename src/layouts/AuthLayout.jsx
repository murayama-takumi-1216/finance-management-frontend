import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Finance Manager</h1>
          <p className="text-gray-600 mt-2">Manage your finances with ease</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
