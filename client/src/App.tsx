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
import { AdminEquipmentPage } from './pages/AdminEquipmentPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { X } from 'lucide-react';
import { TopNavigationBar } from './components/TopNavigationBar';
import { EquipmentLookupModal } from './components/EquipmentLookupModal';

const MainLayout: React.FC = () => {
  const { user, isAuthenticated, loading, updateUser, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('catalog');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedTicketCode, setSelectedTicketCode] = useState<string | null>(null);
  const [selectedTicketStatus, setSelectedTicketStatus] = useState<string | null>(null);
  const [isEquipmentLookupOpen, setIsEquipmentLookupOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Inicializar la pestaña según el perfil del usuario:
  useEffect(() => {
    if (user) {
      if (hasRole('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG')) {
        setActiveTab('admin-dashboard');
      } else if (hasRole('MESA_AYUDA_SG')) {
        setActiveTab('sg-dashboard');
      } else if (hasRole('MESA_AYUDA', 'TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG')) {
        setActiveTab('specialist');
      } else {
        setActiveTab('catalog');
      }
    }
  }, [user, hasRole]);

  // Manejo de historial HTML5 para evitar que el usuario salga del sistema con la flecha Atrás
  useEffect(() => {
    // Estado inicial en el navegador
    window.history.replaceState({ tab: activeTab, ticketId: selectedTicketId, ticketCode: selectedTicketCode }, '');

    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        if (event.state.ticketId !== undefined) {
          setSelectedTicketId(event.state.ticketId);
          setSelectedTicketCode(event.state.ticketCode || null);
        } else {
          setSelectedTicketId(null);
          setSelectedTicketCode(null);
          setSelectedTicketStatus(null);
        }
        if (event.state.tab) {
          setActiveTab(event.state.tab);
        }
      } else {
        // Si no hay estado previo en la app, mantener la vista actual y quitar ticket detail
        setSelectedTicketId(null);
        setSelectedTicketCode(null);
        setSelectedTicketStatus(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Guard de pestañas según roles del usuario para evitar 403 Forbidden
  const safeActiveTab = useMemo(() => {
    if (!user) return 'catalog';
    if (hasRole('ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG')) {
      return activeTab;
    }
    if (hasRole('MESA_AYUDA_SG')) {
      const allowed = ['sg-dashboard', 'specialist', 'tech-attended', 'sg-work-orders', 'sg-inventory', 'infrastructure-inspections', 'admin-equipment', 'catalog', 'my-tickets', 'pending-surveys'];
      return allowed.includes(activeTab) ? activeTab : 'sg-dashboard';
    }
    if (hasRole('MESA_AYUDA', 'TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG')) {
      const allowed = ['specialist', 'tech-attended', 'infrastructure-inspections', 'admin-equipment', 'catalog', 'my-tickets', 'pending-surveys'];
      return allowed.includes(activeTab) ? activeTab : 'specialist';
    }
    // SOLICITANTE
    const allowed = ['catalog', 'my-tickets', 'pending-surveys'];
    return allowed.includes(activeTab) ? activeTab : 'catalog';
  }, [user, activeTab, hasRole]);

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

  const handleSelectTicketDetail = (ticketId: number, ticketCode?: string, ticketStatus?: string) => {
    setSelectedTicketId(ticketId);
    if (ticketCode) setSelectedTicketCode(ticketCode);
    if (ticketStatus) setSelectedTicketStatus(ticketStatus);
    window.history.pushState({ tab: safeActiveTab, ticketId, ticketCode }, '');
  };

  const handleBackFromDetail = () => {
    setSelectedTicketId(null);
    setSelectedTicketCode(null);
    setSelectedTicketStatus(null);
    if (window.history.state && window.history.state.ticketId) {
      window.history.back();
    } else {
      window.history.pushState({ tab: safeActiveTab, ticketId: null }, '');
    }
  };

  const handleTabChange = (newTab: string) => {
    setSelectedTicketId(null);
    setSelectedTicketCode(null);
    setSelectedTicketStatus(null);
    setActiveTab(newTab);
    setIsMobileMenuOpen(false);
    window.history.pushState({ tab: newTab, ticketId: null }, '');
  };

  const isMissingDependencia =
    !user?.facultadDependencia ||
    user.facultadDependencia.trim() === '' ||
    user.facultadDependencia.includes('#N/D');

  const needsInitialSetup =
    Boolean(user && (user.debeCambiarPassword || user.correoPendiente || isMissingDependencia));

  return (
    <div className="min-h-screen w-full max-w-full bg-slate-50 dark:bg-slate-950 flex flex-col overflow-x-hidden print:min-h-0 print:bg-white transition-colors duration-150">
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
                <div className="w-8 h-8 rounded-lg bg-white escudo-white-bg p-1 flex items-center justify-center shadow-xs">
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
                onTabChange={handleTabChange}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
                isMobileDrawer
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 print:block overflow-hidden w-full max-w-full">
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden md:flex shrink-0">
          <Sidebar
            activeTab={selectedTicketId ? 'detail' : safeActiveTab}
            onTabChange={handleTabChange}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-hidden">
          <TopNavigationBar
            userRole={user?.rol}
            activeTab={safeActiveTab}
            selectedTicketId={selectedTicketId}
            selectedTicketCode={selectedTicketCode}
            selectedTicketStatus={selectedTicketStatus}
            onNavigateTab={handleTabChange}
            onBack={handleBackFromDetail}
            onOpenEquipmentLookup={() => setIsEquipmentLookupOpen(true)}
          />

          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6 print:overflow-visible print:h-auto print:block print:p-0 w-full max-w-full min-w-0">
            {selectedTicketId ? (
              <TicketDetailPage
                ticketId={selectedTicketId}
                onBack={handleBackFromDetail}
                onTicketLoaded={(t) => {
                  setSelectedTicketCode(t.codigo_correlativo);
                  setSelectedTicketStatus(t.estado);
                }}
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
          ) : safeActiveTab === 'admin-equipment' ? (
            <AdminEquipmentPage onSelectTicketDetail={handleSelectTicketDetail} />
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
      </div>

      {isEquipmentLookupOpen && (
        <EquipmentLookupModal
          isOpen={isEquipmentLookupOpen}
          onClose={() => setIsEquipmentLookupOpen(false)}
          onSelectTicketDetail={handleSelectTicketDetail}
        />
      )}

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
