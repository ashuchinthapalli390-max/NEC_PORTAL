import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  BarChart3, 
  Bell, 
  Activity, 
  Users, 
  Camera, 
  UserCheck, 
  Award, 
  BookOpen, 
  Building2, 
  ShieldAlert, 
  FileText, 
  Lightbulb, 
  RefreshCw, 
  Calendar, 
  Trophy, 
  Briefcase, 
  Code, 
  GraduationCap, 
  Handshake, 
  Mail, 
  Megaphone, 
  Image as ImageIcon, 
  Download, 
  FileSpreadsheet, 
  Sliders, 
  Grid, 
  Smartphone, 
  Trash2, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  ChevronLeft,
  LogOut, 
  ShieldCheck, 
  Sparkles,
  X
} from 'lucide-react';

import { NAVIGATION_CATEGORIES } from './navigationCategories.js';
import { getInitials, getRolePresentation } from '../../../lib/auth/rolePresentation.js';

export default function FloatingSidebar({
  activeModule,
  onSelectModule,
  sidebarExpanded,
  onToggleSidebar,
  currentUser,
  onNavigatePublic,
  onLogout,
  onExitPortal,
  isMobile = false,
  isMobileDrawer = false,
  onCloseMobileDrawer,
  unreadAlertsCount = 0
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  const userRole = currentUser?.role || 'FACULTY';
  const displayName = currentUser?.name || currentUser?.fullName || 'Academic Officer';
  const rolePresentation = getRolePresentation(userRole, currentUser?.dept, displayName);
  const displayRole = rolePresentation.shortLabel || currentUser?.label || currentUser?.role || 'Staff';
  const initials = getInitials(displayName);

  // Auto-expand category containing active module
  useEffect(() => {
    NAVIGATION_CATEGORIES.forEach(cat => {
      const hasActive = cat.items.some(item => item.id === activeModule);
      if (hasActive) {
        setExpandedCategories(prev => ({ ...prev, [cat.id]: true }));
      }
    });
  }, [activeModule]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    if (!isMobileDrawer) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onCloseMobileDrawer) {
        onCloseMobileDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawer, onCloseMobileDrawer]);

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Filter categories by user permissions/roles & search query
  const filteredCategories = NAVIGATION_CATEGORIES.map(cat => {
    // Hide IAM / Administration category for non-admin users
    if (cat.id === 'cat-admin' && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      const hasIamPerm = currentUser?.permissions?.some(p => p.startsWith('users.') || p.startsWith('iam.'));
      if (!hasIamPerm) return null;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return cat;

    const matchesCat = cat.label.toLowerCase().includes(q);
    const matchingItems = cat.items.filter(item => item.label.toLowerCase().includes(q));

    if (matchesCat || matchingItems.length > 0) {
      return {
        ...cat,
        items: matchingItems.length > 0 ? matchingItems : cat.items
      };
    }
    return null;
  }).filter(Boolean);

  // If on mobile and drawer is closed, do NOT render in document flow
  if (isMobile && !isMobileDrawer) {
    return null;
  }

  const isExpandedView = isMobile ? true : sidebarExpanded;
  const sidebarWidth = isMobile ? 'min(86vw, 320px)' : (sidebarExpanded ? '310px' : '82px');

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobile && isMobileDrawer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCloseMobileDrawer}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 15, 30, 0.78)',
            backdropFilter: 'blur(8px)',
            zIndex: 1050
          }}
        />
      )}

      {/* Floating Sidebar Container */}
      <motion.aside
        initial={isMobile ? { x: '-100%' } : false}
        animate={isMobile ? { x: 0 } : { width: sidebarWidth }}
        exit={isMobile ? { x: '-100%' } : undefined}
        transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
        style={{
          position: isMobile ? 'fixed' : 'sticky',
          top: isMobile ? 0 : 'calc(65px + var(--portal-shell-y, 16px))',
          left: 0,
          bottom: isMobile ? 0 : 'auto',
          width: sidebarWidth,
          height: isMobile ? '100vh' : 'calc(100vh - 65px - (2 * var(--portal-shell-y, 16px)))',
          background: 'linear-gradient(180deg, #070F1E 0%, #0B192C 60%, #081220 100%)',
          borderRadius: isMobile ? '0 20px 20px 0' : '20px',
          border: '1px solid rgba(212, 175, 55, 0.22)',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.45), 0 0 15px rgba(212, 175, 55, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: isMobile ? 1100 : 90,
          overflow: 'hidden',
          flexShrink: 0,
          margin: 0
        }}
      >
        {/* Header Block with Search */}
        <div style={{
          padding: '1rem 0.9rem 0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0
        }}>
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img 
                  src="/assets/NEC Logos/College-logo.jpeg" 
                  alt="NEC Crest" 
                  style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #D4AF37' }}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Navigation Hub
                </span>
              </div>
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#94A3B8',
                  borderRadius: '6px',
                  padding: '0.35rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {isExpandedView ? (
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748B'
                }}
              />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem 0.45rem 2rem',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={onToggleSidebar}
                title="Expand Navigation Menu"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '8px',
                  color: '#D4AF37',
                  padding: '0.45rem',
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Search size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isExpandedView ? '0.6rem 0.65rem' : '0.6rem 0.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          {filteredCategories.map(cat => {
            const CatIcon = cat.icon;
            const isCatExpanded = isExpandedView ? (expandedCategories[cat.id] ?? false) : false;
            const hasActiveModule = cat.items.some(item => item.id === activeModule);

            return (
              <div key={cat.id} style={{ marginBottom: '0.2rem' }}>
                {/* Category Header Button */}
                {isExpandedView ? (
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      background: hasActiveModule ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      color: hasActiveModule ? '#F1C40F' : '#94A3B8',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    className="hover:bg-white/5"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CatIcon size={14} style={{ color: hasActiveModule ? '#F1C40F' : '#64748B' }} />
                      <span>{cat.label}</span>
                    </span>
                    <motion.span
                      animate={{ rotate: isCatExpanded ? 90 : 0 }}
                      transition={{ duration: 0.18 }}
                      style={{ display: 'inline-flex' }}
                    >
                      <ChevronRight size={12} />
                    </motion.span>
                  </button>
                ) : null}

                {/* Submenu Items */}
                <AnimatePresence initial={false}>
                  {(isExpandedView ? isCatExpanded : true) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.18rem',
                        paddingLeft: isExpandedView ? '0.4rem' : '0',
                        marginTop: isExpandedView ? '0.2rem' : '0'
                      }}
                    >
                      {cat.items.map(item => {
                        const ItemIcon = item.icon;
                        const isActive = activeModule === item.id;
                        
                        // Resolve dynamic badge (only if valid real count > 0)
                        let badgeCount = null;
                        if (item.dynamicBadgeKey === 'alerts' && unreadAlertsCount > 0) {
                          badgeCount = unreadAlertsCount;
                        }

                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              onSelectModule(item.id);
                              if (isMobile && onCloseMobileDrawer) onCloseMobileDrawer();
                            }}
                            whileHover={{ x: isExpandedView ? 2 : 0, scale: 1.015 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            title={!isExpandedView ? item.label : undefined}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: isExpandedView ? 'space-between' : 'center',
                              width: '100%',
                              padding: isExpandedView ? '0.48rem 0.65rem' : '0.65rem 0',
                              borderRadius: '8px',
                              background: isActive
                                ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.12) 100%)'
                                : 'transparent',
                              border: isActive ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid transparent',
                              color: isActive ? '#FFFFFF' : '#CBD5E1',
                              fontSize: '0.79rem',
                              fontWeight: isActive ? 700 : 500,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'background 0.15s ease, border-color 0.15s ease',
                              position: 'relative'
                            }}
                            className={isActive ? 'shadow-sm' : 'hover:bg-white/5 hover:text-white'}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
                              <ItemIcon
                                size={15}
                                style={{
                                  color: isActive ? '#F1C40F' : '#94A3B8',
                                  flexShrink: 0,
                                  transition: 'transform 0.15s ease'
                                }}
                              />
                              {isExpandedView && (
                                <span style={{
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {item.label}
                                </span>
                              )}
                            </span>

                            {isExpandedView && badgeCount && (
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                padding: '0.12rem 0.45rem',
                                borderRadius: '9999px',
                                background: '#DC2626',
                                color: '#FFFFFF',
                                marginLeft: '0.4rem',
                                flexShrink: 0
                              }}>
                                {badgeCount}
                              </span>
                            )}

                            {isExpandedView && item.badge && !badgeCount && (
                              <span style={{
                                fontSize: '0.58rem',
                                fontWeight: 800,
                                padding: '0.1rem 0.4rem',
                                borderRadius: '9999px',
                                background: 'rgba(212, 175, 55, 0.2)',
                                color: '#D4AF37',
                                border: '1px solid rgba(212, 175, 55, 0.4)',
                                marginLeft: '0.4rem',
                                flexShrink: 0,
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em'
                              }}>
                                {item.badge}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Footer Identity & Collapse Button */}
        <div style={{
          padding: '0.75rem 0.85rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.25)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpandedView ? 'space-between' : 'center',
          gap: '0.5rem'
        }}>
          {isExpandedView ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)',
                color: '#070F1E',
                fontWeight: 800,
                fontSize: '0.76rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {initials}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {displayName}
                </div>
                <div style={{
                  fontSize: '0.66rem',
                  color: '#D4AF37',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}>
                  <ShieldCheck size={9} />
                  <span>{displayRole}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F1C40F 0%, #D4AF37 100%)',
              color: '#070F1E',
              fontWeight: 800,
              fontSize: '0.76rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {initials}
            </div>
          )}

          {!isMobile && (
            <button
              type="button"
              onClick={onToggleSidebar}
              title={sidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#CBD5E1',
                borderRadius: '6px',
                padding: '0.35rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="hover:bg-white/10 hover:text-white"
            >
              {sidebarExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}
