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
} from '@heroicons/react/24/outline';
import { useAuthStore, useAccountsStore, useUIStore } from '../store/useStore';

const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Accounts', href: '/accounts', icon: CreditCardIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const accountNavItems = [
  { name: 'Overview', href: '', icon: HomeIcon },
  { name: 'Movements', href: '/movements', icon: DocumentChartBarIcon },
  { name: 'Categories', href: '/categories', icon: FolderIcon },
  { name: 'Tags', href: '/tags', icon: TagIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
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
    <div className="min-h-screen bg-gray-50">
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
            <div className="fixed inset-0 bg-gray-900/80" />
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
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6 text-white" />
                  </button>
                </div>

                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <span className="text-xl font-bold text-primary-600">Finance Manager</span>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <SidebarContent
                      isAccountPage={isAccountPage}
                      accountId={accountId}
                      currentAccount={currentAccount}
                      accounts={accounts}
                      onClose={() => setMobileMenuOpen(false)}
                    />
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col transition-all duration-300 ${
          sidebarOpen ? 'lg:w-64' : 'lg:w-20'
        }`}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center justify-between">
            {sidebarOpen && (
              <span className="text-xl font-bold text-primary-600">Finance Manager</span>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bars3Icon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col">
            <SidebarContent
              isAccountPage={isAccountPage}
              accountId={accountId}
              currentAccount={currentAccount}
              accounts={accounts}
              collapsed={!sidebarOpen}
            />
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className={`${sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'} transition-all duration-300`}>
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            {/* Account selector for account pages */}
            {isAccountPage && currentAccount && (
              <div className="flex items-center">
                <span className="text-sm text-gray-500">Account:</span>
                <span className="ml-2 font-medium text-gray-900">{currentAccount.nombre}</span>
              </div>
            )}

            <div className="flex flex-1 items-center justify-end gap-x-4 lg:gap-x-6">
              {/* User menu */}
              <Menu as="div" className="relative">
                <Menu.Button className="-m-1.5 flex items-center p-1.5">
                  <div className="flex items-center gap-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    <span className="hidden lg:flex lg:items-center">
                      <span className="text-sm font-semibold text-gray-900">
                        {user?.nombre || 'User'}
                      </span>
                      <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" />
                    </span>
                  </div>
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
                  <Menu.Items className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-lg bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <NavLink
                          to="/settings"
                          className={`block px-4 py-2 text-sm ${
                            active ? 'bg-gray-50' : ''
                          } text-gray-700`}
                        >
                          Settings
                        </NavLink>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            active ? 'bg-gray-50' : ''
                          } text-gray-700`}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

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
    <ul role="list" className="flex flex-1 flex-col gap-y-7">
      <li>
        <ul role="list" className="-mx-2 space-y-1">
          {navItems.map((item) => {
            const href = isAccountPage ? `/accounts/${accountId}${item.href}` : item.href;
            return (
              <li key={item.name}>
                <NavLink
                  to={href}
                  end={item.href === ''}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `${isActive ? 'sidebar-link-active' : 'sidebar-link'} ${
                      collapsed ? 'justify-center px-2' : ''
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </li>

      {/* Back to accounts link when on account page */}
      {isAccountPage && (
        <li>
          <NavLink
            to="/accounts"
            onClick={onClose}
            className={`sidebar-link text-primary-600 ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0 rotate-180" />
            {!collapsed && <span>Back to Accounts</span>}
          </NavLink>
        </li>
      )}

      {/* Quick account switcher when not on account page */}
      {!isAccountPage && accounts.length > 0 && !collapsed && (
        <li>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Quick Access
          </div>
          <ul role="list" className="-mx-2 space-y-1">
            {accounts.slice(0, 5).map((account) => (
              <li key={account.id}>
                <NavLink
                  to={`/accounts/${account.id}`}
                  onClick={onClose}
                  className="sidebar-link text-sm"
                >
                  <CreditCardIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{account.nombre}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </li>
      )}
    </ul>
  );
}

export default DashboardLayout;
