import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const links = [
  { to: '/admin',            label: 'لوحة التحكم', icon: 'fas fa-chart-bar',    end: true },
  { to: '/admin/categories', label: 'الأقسام',     icon: 'fas fa-tags' },
  { to: '/admin/menu',       label: 'المنيو',       icon: 'fas fa-hamburger' },
  { to: '/admin/reviews',    label: 'التقييمات',    icon: 'fas fa-star' },
  { to: '/admin/settings',   label: 'الإعدادات',   icon: 'fas fa-cog' },
]

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  // 1. إضافة حالة للتحكم في ظهور القائمة على الموبايل
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  // دالة لإغلاق القائمة (هنستخدمها مع الروابط والـ Overlay)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="h-screen bg-dbg flex overflow-hidden" style={{ direction: 'rtl' }}>
      
      {/* 2. طبقة الـ Overlay للموبايل (تقفل القائمة لما تضغط خارجها) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* 3. الـ Sidebar نفسه مع تأثيرات الظهور والإخفاء */}
      <aside 
        className={`fixed inset-y-0 right-0 z-40 w-60 bg-dcard2 border-l border-dborder flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-dborder flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand/10 border border-brand/30 rounded-xl flex items-center justify-center">
              <i className="fas fa-hamburger text-brand text-sm" />
            </div>
            <div>
              <p className="text-brand font-extrabold text-sm leading-none">BB2 Burger</p>
              <p className="text-dmuted text-xs mt-1">لوحة التحكم</p>
            </div>
          </div>
          {/* زر إغلاق القائمة من الداخل (اختياري بس بيحسن تجربة الموبايل) */}
          <button className="md:hidden text-dmuted hover:text-dtext" onClick={closeSidebar}>
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {links.map(l => (
            <NavLink 
              key={l.to} 
              to={l.to} 
              end={l.end}
              onClick={closeSidebar} // <-- 4. إغلاق القائمة عند اختيار أي رابط
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand/10 text-brand border border-brand/20'
                    : 'text-dmuted hover:text-dtext hover:bg-white/5'
                }`
              }>
              <i className={`${l.icon} w-4 text-center`} />
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-dborder">
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-dmuted hover:text-ddanger hover:bg-ddanger/5 transition-all">
            <i className="fas fa-sign-out-alt w-4 text-center" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* 5. المحتوى الرئيسي والشريط العلوي للموبايل */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* شريط علوي يظهر فقط على الشاشات الصغيرة (الموبايل) */}
        <header className="md:hidden flex items-center justify-between p-4 bg-dcard2 border-b border-dborder">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand/10 border border-brand/30 rounded-xl flex items-center justify-center">
              <i className="fas fa-hamburger text-brand text-xs" />
            </div>
            <p className="text-brand font-extrabold text-sm leading-none">BB2 Burger</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-dtext hover:text-brand focus:outline-none"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        </header>

        {/* محتوى الصفحات */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-5xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}
