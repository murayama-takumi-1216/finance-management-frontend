import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import { Fragment, useState, useEffect } from 'react';
import { Menu, Transition, Dialog } from '@headlessui/react';
import {
  HomeIcon,
  CreditCardIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  FolderIcon,
  TagIcon,
  DocumentChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WalletIcon,
  SparklesIcon,
  ArrowLeftIcon,
  BellIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore, useAccountsStore, useUIStore } from '../store/useStore';
import NotificationBell from '../components/NotificationBell';

const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, color: 'indigo' },
  { name: 'Accounts', href: '/accounts', icon: WalletIcon, color: 'emerald' },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon, color: 'amber' },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon, color: 'rose' },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, color: 'slate' },
];

const accountNavItems = [
  { name: 'Overview', href: '', icon: HomeIcon, color: 'indigo' },
  { name: 'Movements', href: '/movements', icon: DocumentChartBarIcon, color: 'emerald' },
  { name: 'Categories', href: '/categories', icon: FolderIcon, color: 'violet' },
  { name: 'Tags', href: '/tags', icon: TagIcon, color: 'pink' },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon, color: 'cyan' },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon, color: 'amber' },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon, color: 'rose' },
];

function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { accounts, fetchAccounts, currentAccount, setCurrentAccount } = useAccountsStore();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { accountId } = useParams();

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (accountId && accounts.length > 0) {
      const account = accounts.find((a) => a.id === accountId);
      if (account) {
        setCurrentAccount(account);
      }
    }
  }, [accountId, accounts, setCurrentAccount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAccountPage = !!accountId;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Mobile menu */}
      <Transition.Root show={mobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setMobileMenuOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>

                {/* Mobile Sidebar Content */}
                <div className="flex grow flex-col overflow-y-auto bg-white">
                  {/* Logo */}
                  <div className="flex h-20 items-center px-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                        <SparklesIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          Finance
                        </span>
                        <span className="text-lg font-bold text-gray-900"> Manager</span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <nav className="flex flex-1 flex-col px-4 py-6">
                    <SidebarContent
                      isAccountPage={isAccountPage}
                      accountId={accountId}
                      currentAccount={currentAccount}
                      accounts={accounts}
                      onClose={() => setMobileMenuOpen(false)}
                    />
                  </nav>

                  {/* User section */}
                  <div className="border-t border-gray-100 p-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.nombre || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:w-72' : 'lg:w-20'
        }`}
      >
        <div className="flex grow flex-col overflow-y-auto bg-white border-r border-gray-200/80">
          {/* Logo */}
          <div className={`flex h-20 items-center border-b border-gray-100 ${sidebarOpen ? 'px-6' : 'px-4 justify-center'}`}>
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Finance
                  </span>
                  <span className="text-lg font-bold text-gray-900"> Manager</span>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex flex-1 flex-col ${sidebarOpen ? 'px-4' : 'px-2'} py-6`}>
            <SidebarContent
              isAccountPage={isAccountPage}
              accountId={accountId}
              currentAccount={currentAccount}
              accounts={accounts}
              collapsed={!sidebarOpen}
            />
          </nav>

          {/* Collapse button */}
          <div className={`border-t border-gray-100 p-4 ${!sidebarOpen && 'flex justify-center'}`}>
            <button
              onClick={toggleSidebar}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all ${
                sidebarOpen ? 'w-full' : 'w-10 h-10 justify-center'
              }`}
            >
              {sidebarOpen ? (
                <>
                  <ChevronLeftIcon className="h-5 w-5" />
                  <span>Collapse</span>
                </>
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`${sidebarOpen ? 'lg:pl-72' : 'lg:pl-20'} transition-all duration-300 ease-in-out`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/80">
          <div className="flex h-16 items-center gap-x-4 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              type="button"
              className="p-2 -m-2 text-gray-500 hover:text-gray-700 lg:hidden rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200 lg:hidden" />

            {/* Left side */}
            <div className="flex flex-1 items-center gap-x-4">
              {/* Account badge */}
              {isAccountPage && currentAccount && (
                <div className="hidden sm:flex items-center gap-2">
                  <NavLink
                    to="/accounts"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </NavLink>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
                    <WalletIcon className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">{currentAccount.nombre}</span>
                    <span className="text-xs text-indigo-500 capitalize">({currentAccount.tipo})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-x-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* User menu */}
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <span className="text-xs font-semibold text-white">
                      {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{user?.nombre || 'User'}</p>
                  </div>
                  <ChevronDownIcon className="hidden md:block h-4 w-4 text-gray-400" />
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5 focus:outline-none">
                    {/* User info */}
                    <div className="px-3 py-2 mb-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.nombre || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    <Menu.Item>
                      {({ active }) => (
                        <NavLink
                          to="/settings"
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            active ? 'bg-gray-100' : ''
                          } text-gray-700`}
                        >
                          <Cog6ToothIcon className="h-4 w-4 text-gray-500" />
                          Settings
                        </NavLink>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm ${
                            active ? 'bg-red-50' : ''
                          } text-red-600`}
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ isAccountPage, accountId, currentAccount, accounts, collapsed, onClose }) {
  const navItems = isAccountPage ? accountNavItems : mainNavItems;

  return (
    <div className="flex flex-1 flex-col gap-y-6">
      {/* Main navigation */}
      <div>
        {!collapsed && (
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {isAccountPage ? 'Account Menu' : 'Main Menu'}
          </p>
        )}
        <ul role="list" className="space-y-1">
          {navItems.map((item) => {
            const href = isAccountPage ? `/accounts/${accountId}${item.href}` : item.href;
            return (
              <li key={item.name}>
                <NavLink
                  to={href}
                  end={item.href === ''}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110'} transition-transform`}>
                        <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                      </div>
                      {!collapsed && (
                        <span className="flex-1">{item.name}</span>
                      )}
                      {!collapsed && isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Back to accounts link when on account page */}
      {isAccountPage && (
        <div>
          <NavLink
            to="/accounts"
            onClick={onClose}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            {!collapsed && <span>Back to Accounts</span>}
          </NavLink>
        </div>
      )}

      {/* Quick account switcher */}
      {!isAccountPage && accounts.length > 0 && !collapsed && (
        <div className="mt-auto">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Quick Access
          </p>
          <ul role="list" className="space-y-1">
            {accounts.slice(0, 4).map((account, index) => (
              <li key={account.id}>
                <NavLink
                  to={`/accounts/${account.id}`}
                  onClick={onClose}
                  className="group flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    ['bg-emerald-100', 'bg-violet-100', 'bg-amber-100', 'bg-rose-100'][index % 4]
                  }`}>
                    <WalletIcon className={`h-4 w-4 ${
                      ['text-emerald-600', 'text-violet-600', 'text-amber-600', 'text-rose-600'][index % 4]
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{account.nombre}</p>
                    <p className="text-xs text-gray-400 capitalize">{account.tipo}</p>
                  </div>
                </NavLink>
              </li>
            ))}
            {accounts.length > 4 && (
              <li>
                <NavLink
                  to="/accounts"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
                >
                  <span>View all ({accounts.length})</span>
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Collapsed quick access */}
      {!isAccountPage && accounts.length > 0 && collapsed && (
        <div className="mt-auto space-y-1">
          {accounts.slice(0, 3).map((account, index) => (
            <NavLink
              key={account.id}
              to={`/accounts/${account.id}`}
              onClick={onClose}
              className="group flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 transition-all"
              title={account.nombre}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                ['bg-emerald-100', 'bg-violet-100', 'bg-amber-100'][index % 3]
              }`}>
                <WalletIcon className={`h-4 w-4 ${
                  ['text-emerald-600', 'text-violet-600', 'text-amber-600'][index % 3]
                }`} />
              </div>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
