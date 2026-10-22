import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { SolicitantPortal } from './pages/SolicitantPortal';
import { SpecialistDashboard } from './pages/SpecialistDashboard';
import { TechnicianAttendedTicketsPage } from './pages/TechnicianAttendedTicketsPage';
import { AdminCatalogPage } from './pages/AdminCatalogPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { InfrastructureInspectionsPage } from './pages/InfrastructureInspectionsPage';
import { SGWorkOrdersHistoryPage } from './pages/SGWorkOrdersHistoryPage';
import { SGInventoryPage } from './pages/SGInventoryPage';
import { SGDashboardPage } from './pages/SGDashboardPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isAuthenticated, loading, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('catalog');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Inicializar la pestaña según el perfil del usuario:
  // Mesa de Ayuda SG aterriza en su nuevo Dashboard interactivo de SG
  // Técnicos y mesa de ayuda OTIC aterrizan en su cola de triage / tickets
  // Administradores y supervisores en su Dashboard Directivo
  // Solicitantes en el Catálogo de Servicios
  useEffect(() => {
    if (user?.rol) {
      if (['ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'].includes(user.rol)) {
        setActiveTab('admin-dashboard');
      } else if (user.rol === 'MESA_AYUDA_SG') {
        setActiveTab('sg-dashboard');
      } else if (['MESA_AYUDA', 'TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(user.rol)) {
        setActiveTab('specialist');
      } else {
        setActiveTab('catalog');
      }
    }
  }, [user?.rol]);

  // Guard de pestañas según rol del usuario para evitar 403 Forbidden
  const safeActiveTab = useMemo(() => {
    if (!user?.rol) return 'catalog';
    if (['ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG'].includes(user.rol)) {
      return activeTab;
    }
    if (user.rol === 'MESA_AYUDA_SG') {
      const allowed = ['sg-dashboard', 'specialist', 'tech-attended', 'sg-work-orders', 'sg-inventory', 'infrastructure-inspections', 'catalog', 'my-tickets', 'pending-surveys'];
      return allowed.includes(activeTab) ? activeTab : 'sg-dashboard';
    }
    if (['MESA_AYUDA', 'TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(user.rol)) {
      const allowed = ['specialist', 'tech-attended', 'infrastructure-inspections', 'catalog', 'my-tickets', 'pending-surveys'];
      return allowed.includes(activeTab) ? activeTab : 'specialist';
    }
    // SOLICITANTE
    const allowed = ['catalog', 'my-tickets', 'pending-surveys'];
    return allowed.includes(activeTab) ? activeTab : 'catalog';
  }, [user?.rol, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-unalm-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Cargando Mesa de Ayuda OTIC UNALM...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleSelectTicketDetail = (ticketId: number) => {
    setSelectedTicketId(ticketId);
  };

  const isMissingDependencia =
    !user?.facultadDependencia ||
    user.facultadDependencia.trim() === '' ||
    user.facultadDependencia.includes('#N/D');

  const needsInitialSetup =
    Boolean(user && (user.debeCambiarPassword || user.correoPendiente || isMissingDependencia));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col print:min-h-0 print:bg-white transition-colors duration-150">
      <Navbar
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-xs">
                  <img src="./escudo-color.png" alt="UNALM" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="font-extrabold text-white text-xs block leading-tight">Mesa de Ayuda UNALM</span>
                  <span className="text-[10px] text-slate-400">Navegación de Módulos</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                activeTab={selectedTicketId ? 'detail' : safeActiveTab}
                onTabChange={(tab) => {
                  setSelectedTicketId(null);
                  setActiveTab(tab);
                  setIsMobileMenuOpen(false);
                }}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
                isMobileDrawer
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 print:block overflow-hidden">
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden md:flex shrink-0">
          <Sidebar
            activeTab={selectedTicketId ? 'detail' : safeActiveTab}
            onTabChange={(tab) => {
              setSelectedTicketId(null);
              setActiveTab(tab);
            }}
          />
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-0 print:overflow-visible print:h-auto print:block print:p-0">
          {selectedTicketId ? (
            <TicketDetailPage
              ticketId={selectedTicketId}
              onBack={() => setSelectedTicketId(null)}
            />
          ) : safeActiveTab === 'admin-dashboard' ? (
            <AdminDashboardPage />
          ) : safeActiveTab === 'specialist' ? (
            <SpecialistDashboard onSelectTicketDetail={handleSelectTicketDetail} />
          ) : safeActiveTab === 'tech-attended' ? (
            <TechnicianAttendedTicketsPage onSelectTicketDetail={handleSelectTicketDetail} />
          ) : safeActiveTab === 'admin-users' ? (
            <AdminUsersPage />
          ) : safeActiveTab === 'admin-catalog' ? (
            <AdminCatalogPage />
          ) : safeActiveTab === 'infrastructure-inspections' ? (
            <InfrastructureInspectionsPage onSelectTicketDetail={handleSelectTicketDetail} />
          ) : safeActiveTab === 'sg-dashboard' ? (
            <SGDashboardPage
              onSelectTicketDetail={handleSelectTicketDetail}
              onNavigateTab={(tab) => {
                setSelectedTicketId(null);
                setActiveTab(tab);
              }}
            />
          ) : safeActiveTab === 'sg-work-orders' ? (
            <SGWorkOrdersHistoryPage onSelectTicketDetail={handleSelectTicketDetail} />
          ) : safeActiveTab === 'sg-inventory' ? (
            <SGInventoryPage />
          ) : safeActiveTab === 'my-tickets' ? (
            <SolicitantPortal
              viewMode="my-tickets"
              onSelectTicketDetail={handleSelectTicketDetail}
              onNavigateTab={(tab) => {
                setSelectedTicketId(null);
                setActiveTab(tab);
              }}
            />
          ) : safeActiveTab === 'pending-surveys' ? (
            <SolicitantPortal
              viewMode="pending-surveys"
              onSelectTicketDetail={handleSelectTicketDetail}
              onNavigateTab={(tab) => {
                setSelectedTicketId(null);
                setActiveTab(tab);
              }}
            />
          ) : (
            <SolicitantPortal
              viewMode="catalog"
              onSelectTicketDetail={handleSelectTicketDetail}
              onNavigateTab={(tab) => {
                setSelectedTicketId(null);
                setActiveTab(tab);
              }}
            />
          )}
        </main>
      </div>

      {user && needsInitialSetup && (
        <ForcePasswordChangeModal
          user={user}
          onSuccess={(updatedUser) => {
            updateUser(updatedUser);
          }}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
