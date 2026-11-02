/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useClinicStore } from './store/useClinicStore';
import { DemoRoleSwitcherBar } from './components/layout/DemoRoleSwitcherBar';
import { PortalLayout } from './components/layout/PortalLayout';
import { WorkspaceLayout } from './components/layout/WorkspaceLayout';
import { PortalHome } from './components/portal/PortalHome';
import { BookingWizardPage } from './components/portal/BookingWizardPage';
import { OnboardingProfilePage } from './components/portal/OnboardingProfilePage';
import { PatientVisitsPage } from './components/portal/PatientVisitsPage';
import { SpecialtyDetailTemplate } from './components/portal/templates/SpecialtyDetailTemplate';
import { DoctorsDirectoryTemplate } from './components/portal/templates/DoctorsDirectoryTemplate';
import { PricingServicesTemplate } from './components/portal/templates/PricingServicesTemplate';
import { AuthModal } from './components/portal/AuthModal';
import { ReceptionistDesk } from './components/workspace/ReceptionistDesk';
import { DoctorWorkspace } from './components/workspace/DoctorWorkspace';
import { AdminWorkspace } from './components/workspace/AdminWorkspace';
import { OnboardingGuardModal } from './components/modals/OnboardingGuardModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { SPECIALTIES_DATA } from './services/mockData';
import { Doctor, Specialty } from './types';

export default function App() {
  const { activeRole } = useAuthStore();
  const { currentPortalNav, setPortalNav } = useClinicStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalNotice, setAuthModalNotice] = useState<string>('');
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | undefined>(undefined);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty>(SPECIALTIES_DATA[0]);

  const handlePromptLogin = (customMessage?: string) => {
    setAuthModalNotice(
      customMessage || 'Vui lòng đăng nhập hoặc đăng ký tài khoản bệnh nhân để tiến hành đặt lịch khám!'
    );
    setIsAuthModalOpen(true);
  };

  const handleOpenBooking = (doctor?: Doctor) => {
    if (activeRole === 'guest') {
      handlePromptLogin('Vui lòng đăng nhập hoặc đăng ký tài khoản để tiến hành đặt lịch khám.');
      return;
    }
    setSelectedDoctorForBooking(doctor);
    setPortalNav('booking');
  };

  const isPortalMode = activeRole === 'guest' || activeRole === 'patient';

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-slate-800 bg-white">
      {/* 1. DEMO ROLE SWITCHER BAR (Sticky at topmost edge for exam grading & demonstration) */}
      <DemoRoleSwitcherBar />

      {/* 2. PWA Offline Indicator */}
      <OfflineIndicator />

      {/* 3. STRICT LAYOUT ISOLATION ROUTING */}
      {isPortalMode ? (
        /* =========================================================================
           ROOT LAYOUT A: PORTAL LAYOUT (GUEST & PATIENTS ONLY)
           Features: Top Utility Bar + Sticky Navbar + Portal Content + Footer +
           Messenger AI RAG Chat Widget
        ========================================================================= */
        <PortalLayout
          onOpenAuthModal={() => handlePromptLogin()}
          onOpenBookingWizard={() => handleOpenBooking()}
        >
          {/* Template 1: Main Portal Home (Hero, 4 Quick Actions, 8 Specialties, Doctors, Pricing, FAQ) */}
          {(currentPortalNav === 'home' || currentPortalNav === 'instructions') && (
            <PortalHome 
              onOpenBookingWizard={handleOpenBooking} 
              onSelectSpecialty={(spec) => {
                setSelectedSpecialty(spec);
                // Giữ nguyên ở Trang chủ với hiệu ứng phóng to / thu nhỏ tại chỗ theo yêu cầu
              }}
              onOpenAuthModal={() => handlePromptLogin('Vui lòng đăng nhập hoặc đăng ký tài khoản để tiến hành đặt lịch khám.')}
            />
          )}

          {/* Template 2: Dedicated Specialty Detail View (Specialty info + doctors in this specialty) */}
          {currentPortalNav === 'specialties' && (
            <SpecialtyDetailTemplate
              specialty={selectedSpecialty}
              onBack={() => setPortalNav('home')}
              onSelectDoctor={(doc) => handleOpenBooking(doc)}
              onBookSpecialty={(spec) => {
                setSelectedSpecialty(spec);
                handleOpenBooking();
              }}
            />
          )}

          {/* Template 3: Doctors Directory View */}
          {currentPortalNav === 'doctors' && (
            <DoctorsDirectoryTemplate
              onBack={() => setPortalNav('home')}
              onSelectDoctor={(doc) => handleOpenBooking(doc)}
            />
          )}

          {/* Template 4: Pricing & Clinical Services Table View */}
          {currentPortalNav === 'pricing' && (
            <PricingServicesTemplate
              onBack={() => setPortalNav('home')}
              onBookService={() => handleOpenBooking()}
            />
          )}

          {/* Template 5: Booking 3-Step Wizard with Login Prompt / Onboarding Gate & Overbooking Guard */}
          {currentPortalNav === 'booking' && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
              <BookingWizardPage 
                initialDoctor={selectedDoctorForBooking} 
                onOpenAuthModal={() => handlePromptLogin('Vui lòng đăng nhập hoặc đăng ký tài khoản để tiến hành đặt lịch khám.')}
              />
            </div>
          )}

          {/* Template 6: Patient Medical Visits, 5-Step Live Stepper & EMR Prescriptions */}
          {currentPortalNav === 'my-visits' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
              <PatientVisitsPage />
            </div>
          )}

          {/* Template 7: Patient Personal & Health Profile Onboarding */}
          {currentPortalNav === 'profile' && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
              <OnboardingProfilePage />
            </div>
          )}
        </PortalLayout>
      ) : (
        /* =========================================================================
           ROOT LAYOUT B: WORKSPACE LAYOUT (CLINICAL DESKS & ADMIN ONLY)
           Features: Fixed 260px Sidebar + Thin Topbar (Breadcrumb + Gateway Status) +
           High-Density Workspace.
           NO Banner, NO Hospital Footer, NO Patient Chat Widget.
        ========================================================================= */
        <WorkspaceLayout>
          {/* Receptionist Desk */}
          {activeRole === 'receptionist' && <ReceptionistDesk />}

          {/* Clinical Doctor Workspace (DOC-01 Primary & DOC-02 Imaging) */}
          {(activeRole === 'doctor_primary' || activeRole === 'doctor_imaging') && (
            <DoctorWorkspace />
          )}

          {/* Admin Workspace (HIS Dashboard Analytics, RAG Knowledge Base, Master Data, Audit Logs with Diff) */}
          {activeRole === 'admin' && <AdminWorkspace />}
        </WorkspaceLayout>
      )}

      {/* Global Modals for Portal Interactions */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        noticeMessage={authModalNotice}
      />

      <OnboardingGuardModal />
    </div>
  );
}
