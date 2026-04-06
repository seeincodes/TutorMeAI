import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'

const TEACHING_NAV = [
  { to: '/dashboard/students', label: 'Students', icon: UsersIcon },
  { to: '/dashboard/classrooms', label: 'Classrooms', icon: ClassroomIcon },
  { to: '/dashboard/apps', label: 'Apps', icon: GridIcon },
  { to: '/dashboard/flags', label: 'Flags', icon: FlagIcon },
]

const ADMIN_NAV = [
  { to: '/dashboard/teachers', label: 'Teachers', icon: TeacherIcon },
  { to: '/dashboard/districts', label: 'Districts', icon: BuildingIcon },
  { to: '/dashboard/marketplace', label: 'Marketplace', icon: StoreIcon },
  { to: '/dashboard/health', label: 'App Health', icon: HeartIcon },
  { to: '/dashboard/costs', label: 'Costs', icon: CoinIcon },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin' || user?.role === 'district_admin'

  return (
    <div className="flex h-screen bg-chatbox-background-primary">
      {/* Sidebar */}
      <aside className="flex w-52 flex-col border-r border-chatbox-border-primary bg-chatbox-background-primary">
        {/* Brand */}
        <div className="border-b border-chatbox-border-primary px-4 py-3">
          <button onClick={() => navigate('/')} className="text-base font-bold text-chatbox-tint-primary hover:text-chatbox-tint-brand transition-colors">
            ChatBridge
          </button>
          <button
            onClick={() => navigate('/')}
            className="mt-1 flex items-center gap-1 text-xs text-chatbox-tint-tertiary hover:text-chatbox-tint-primary transition-colors"
          >
            <ArrowLeftIcon />
            Back to Chat
          </button>
        </div>

        {/* Teaching section */}
        <nav className="flex-1 overflow-y-auto px-2 pt-3">
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Teaching</p>
          {TEACHING_NAV.map(item => (
            <SidebarLink key={item.to} {...item} />
          ))}

          {/* Admin section */}
          {isAdmin && (
            <>
              <p className="mb-1 mt-4 px-2 text-[10px] font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Admin</p>
              {ADMIN_NAV.map(item => (
                <SidebarLink key={item.to} {...item} />
              ))}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-chatbox-border-primary px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-chatbox-background-brand-primary text-xs font-medium text-chatbox-tint-white">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-chatbox-tint-primary">{user?.username}</span>
                <span className="text-[10px] capitalize text-chatbox-tint-tertiary">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded px-2 py-0.5 text-xs text-chatbox-tint-error hover:bg-chatbox-background-error-secondary transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}

function SidebarLink({ to, label, icon: Icon }: { to: string; label: string; icon: React.FC }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
          isActive
            ? 'border-l-[3px] border-chatbox-tint-brand bg-chatbox-background-brand-secondary text-chatbox-tint-brand font-medium'
            : 'border-l-[3px] border-transparent text-chatbox-tint-secondary hover:bg-chatbox-background-secondary'
        )
      }
    >
      <Icon />
      {label}
    </NavLink>
  )
}

// SVG Icons (16x16, stroke-based)
function TeacherIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}
function ArrowLeftIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
}

function UsersIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}

function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
}

function FlagIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
}

function BuildingIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" /></svg>
}

function StoreIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
}

function HeartIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
}

function CoinIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
}

function ClassroomIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
}
