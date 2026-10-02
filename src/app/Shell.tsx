import { ThemeSelector } from '../theme/ThemeSelector';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createContext, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AppBar,
  Box,
  Collapse,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../core/auth';
import { loadMenu, permittedPaths, routePath, type MenuItem } from '../core/navigation';
import { ErrorState, Loading } from '../components/Status';
import { pages } from './pages';

const MenuContext = createContext<{ menu: MenuItem[]; allowed: Set<string> }>({
  menu: [],
  allowed: new Set(),
});
export function ProtectedRoute() {
  const { session } = useAuth();
  const location = useLocation();
  return session ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  );
}
export function DashboardLayoutNavigationLinks() {
  const { session, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const mobile = useMediaQuery('(max-width:760px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const navigationOpen = mobile ? open : desktopOpen;
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const menu = useQuery({
    queryKey: ['navigation', session?.username],
    queryFn: ({ signal }) => loadMenu(signal),
    retry: false,
    staleTime: 300_000,
  });
  const home = '/Dashboard/UserDashboard';
  const known = new Set(pages.map((page) => page.path.toLowerCase()));

  const getMenuIcon = (title: string) => {
    const value = title.toLowerCase();
    if (value.includes('dashboard') || value.includes('profile')) return <DashboardRoundedIcon />;
    if (value.includes('user') || value.includes('partner') || value.includes('customer'))
      return <PeopleAltRoundedIcon />;
    if (value.includes('pay') || value.includes('bank') || value.includes('account'))
      return <AccountBalanceRoundedIcon />;
    if (value.includes('setting') || value.includes('config')) return <SettingsRoundedIcon />;
    return <ViewListRoundedIcon />;
  };

  const toggleGroup = (menuId: number) => {
    setExpanded((current) => {
      const next = { ...current };
      const currentOpen = current[menuId] ?? false;

      Object.keys(next).forEach((key) => {
        next[Number(key)] = false;
      });

      next[menuId] = !currentOpen;
      return next;
    });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'var(--color-background)' }}>
      <Drawer
        variant={mobile ? 'temporary' : 'persistent'}
        open={navigationOpen}
        transitionDuration={reducedMotion ? 0 : 200}
        onClose={() => setOpen(false)}
        sx={{
          width: mobile || !desktopOpen ? 0 : 'var(--layout-sidebar-width)',
          transition: reducedMotion ? 'none' : 'width 200ms ease',
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 'var(--layout-sidebar-width)',
            boxSizing: 'border-box',
            background: 'var(--navigation-sidebar-background)',
            color: 'var(--navigation-sidebar-text)',
            borderRight: 'none',
            px: 1.6,
            py: 2.5,
            boxShadow: 'var(--shadow-lg)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, mb: 2.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 'var(--border-radius-md)',
              background: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 'var(--typography-font-weight-bold)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            F
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'var(--typography-font-weight-bold)',
              color: 'var(--navigation-sidebar-active-text)',
              letterSpacing: 0.4,
            }}
          >
            FINOVA
          </Typography>
        </Box>

        <Typography
          sx={{
            px: 1.5,
            mb: 2,
            fontSize: 'var(--typography-font-size-sm)',
            letterSpacing: '0.18em',
            fontWeight: 'var(--typography-font-weight-bold)',
            color: 'var(--navigation-sidebar-text)',
            textTransform: 'uppercase',
          }}
        >
          FINOVA DASHBOARD
        </Typography>

        <List
          id="primary-navigation"
          component="nav"
          aria-label="Main navigation"
          disablePadding
          sx={{ width: '100%' }}
        >
          <ListItemButton
            component={NavLink}
            to={home}
            onClick={() => setOpen(false)}
            sx={{
              borderRadius: 'var(--border-radius-md)',
              minHeight: 52,
              color: 'var(--navigation-sidebar-text)',
              mb: 0.8,
              background: 'transparent',
              '&.active': {
                bgcolor: 'var(--navigation-sidebar-active-background)',
                color: 'var(--navigation-sidebar-active-text)',
                boxShadow: 'none',
              },
              '&:hover': { bgcolor: 'var(--navigation-sidebar-hover-background)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
              <DashboardRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography
                sx={{
                  fontSize: 'var(--typography-font-size-sm)',
                  fontWeight: 'var(--typography-font-weight-semibold)',
                  color: 'inherit',
                }}
              >
                Home
              </Typography>
            </ListItemText>
          </ListItemButton>

          {menu.data?.map((parent) => {
            const children = (parent.children || []).filter(
              (item) => item.RoutePath && known.has(routePath(item.RoutePath).toLowerCase()),
            );
            const hasChildren = children.length > 0;
            const isExpanded = expanded[parent.MenuID] ?? false;
            const parentRoute =
              parent.RoutePath && known.has(routePath(parent.RoutePath).toLowerCase())
                ? routePath(parent.RoutePath)
                : null;

            return (
              <Box key={parent.MenuID} sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    if (hasChildren) toggleGroup(parent.MenuID);
                    else setOpen(false);
                  }}
                  component={hasChildren || !parentRoute ? 'button' : NavLink}
                  aria-expanded={hasChildren ? isExpanded : undefined}
                  to={hasChildren ? undefined : (parentRoute ?? undefined)}
                  sx={{
                    borderRadius: 'var(--border-radius-md)',
                    minHeight: 52,
                    color: 'var(--navigation-sidebar-text)',
                    background: 'transparent',
                    '&.active': {
                      bgcolor: 'var(--navigation-sidebar-active-background)',
                      color: 'var(--navigation-sidebar-active-text)',
                      boxShadow: 'none',
                    },
                    '&:hover': { bgcolor: 'var(--navigation-sidebar-hover-background)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
                    {getMenuIcon(parent.Title)}
                  </ListItemIcon>
                  <ListItemText>
                    <Typography
                      sx={{
                        fontSize: 'var(--typography-font-size-sm)',
                        fontWeight: 'var(--typography-font-weight-semibold)',
                        color: 'inherit',
                      }}
                    >
                      {parent.Title}
                    </Typography>
                  </ListItemText>
                  {hasChildren ? isExpanded ? <ExpandLess /> : <ExpandMore /> : null}
                </ListItemButton>

                {hasChildren && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 1.5, mt: 0.5 }}>
                      {children.map((child) => (
                        <ListItemButton
                          key={child.MenuID}
                          component={NavLink}
                          to={routePath(child.RoutePath!)}
                          onClick={() => setOpen(false)}
                          sx={{
                            borderRadius: 'var(--border-radius-md)',
                            pl: 2.5,
                            py: 1,
                            minHeight: 44,
                            color: 'var(--navigation-sidebar-text)',
                            '&.active': {
                              bgcolor: 'var(--navigation-sidebar-active-background)',
                              color: 'var(--navigation-sidebar-active-text)',
                              boxShadow: 'none',
                            },
                            '&:hover': { bgcolor: 'var(--navigation-sidebar-hover-background)' },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 30, color: 'inherit' }}>
                            {getMenuIcon(child.Title)}
                          </ListItemIcon>
                          <ListItemText>
                            <Typography
                              sx={{
                                fontSize: 'var(--typography-font-size-sm)',
                                color: 'inherit',
                                fontWeight: 'var(--typography-font-weight-medium)',
                              }}
                            >
                              {child.Title}
                            </Typography>
                          </ListItemText>
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>

        <Box sx={{ mt: 'auto', px: 1.5, pt: 3, color: 'var(--navigation-sidebar-text)' }}>
          <Typography sx={{ fontWeight: 'var(--typography-font-weight-bold)' }}>FINOVA</Typography>
          <Typography
            sx={{
              color: 'var(--navigation-sidebar-text)',
              fontSize: 'var(--typography-font-size-sm)',
            }}
          >
            Business payments
          </Typography>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, ml: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: 'var(--navigation-header-background)',
            color: 'var(--navigation-header-text)',
            borderBottom: '1px solid var(--color-border)',
            ml: 0,
          }}
        >
          <Toolbar
            sx={{
              minHeight: 72,
              p: 1.5,
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <button
                className="secondary"
                type="button"
                aria-label="Toggle navigation"
                title={navigationOpen ? 'Collapse navigation' : 'Expand navigation'}
                aria-controls="primary-navigation"
                aria-expanded={navigationOpen}
                onClick={() =>
                  mobile ? setOpen((value) => !value) : setDesktopOpen((value) => !value)
                }
                style={{ marginRight: 8 }}
              >
                {navigationOpen ? <MenuOpenRoundedIcon /> : <MenuRoundedIcon />}
              </button>
              <Typography sx={{ fontWeight: 'var(--typography-font-weight-semibold)' }}>
                Partner portal
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <ThemeSelector />
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  bgcolor: 'var(--color-selected)',
                  color: 'var(--color-primary)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 'var(--typography-font-weight-bold)',
                }}
              >
                {session?.displayName.slice(0, 1).toUpperCase()}
              </Box>
              <Typography sx={{ fontWeight: 'var(--typography-font-weight-semibold)' }}>
                {session?.displayName}
              </Typography>
              <button className="secondary" onClick={logout}>
                Sign out
              </button>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          id="main"
          tabIndex={-1}
          sx={{
            p: 'var(--layout-page-padding)',
            maxWidth: 'var(--layout-page-max-width)',
            mx: 'auto',
            minHeight: 'calc(100vh - 72px)',
          }}
        >
          {menu.isPending ? (
            <Loading />
          ) : menu.isError ? (
            <ErrorState
              error={menu.error}
              retry={() => {
                void menu.refetch();
              }}
            />
          ) : (
            <MenuContext.Provider value={{ menu: menu.data, allowed: permittedPaths(menu.data) }}>
              <Outlet />
            </MenuContext.Provider>
          )}
        </Box>

        <Box
          sx={{
            px: 3,
            pb: 2,
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--typography-font-size-sm)',
          }}
        >
          © {new Date().getFullYear()} FINOVA
        </Box>
      </Box>
    </Box>
  );
}

export function Shell() {
  return <DashboardLayoutNavigationLinks />;
}
export function PermissionRoute() {
  const { allowed } = useContext(MenuContext);
  const { session } = useAuth();
  const { pathname } = useLocation();
  const self = '/dashboard/userdashboard';
  const normalizedPath = pathname.toLowerCase();
  const masterCrudParent = normalizedPath.replace(/\/(create|view|edit)$/, '');
  const inherited: Record<string, string> = {
    '/dashboard/notifications/sms/create': '/dashboard/notifications/smsgatewaylist',
    '/dashboard/notifications/sms/view': '/dashboard/notifications/smsgatewaylist',
    '/dashboard/notifications/sms/edit': '/dashboard/notifications/smsgatewaylist',
    '/dashboard/notifications/templates/create': '/dashboard/notifications/templates',
    '/dashboard/notifications/templates/view': '/dashboard/notifications/templates',
    '/dashboard/notifications/templates/edit': '/dashboard/notifications/templates',
    '/dashboard/notifications/templatetypes': '/dashboard/notifications/templates',
    '/dashboard/notifications/templatetypes/create': '/dashboard/notifications/templatetypes',
    '/dashboard/notifications/servicetypes': '/dashboard/notifications/templates',
    '/dashboard/notifications/servicetypes/create': '/dashboard/notifications/servicetypes',
    '/dashboard/notifications/create': '/dashboard/notifications/emailgatwaylist',
    '/dashboard/notifications/view': '/dashboard/notifications/emailgatwaylist',
    '/dashboard/notifications/edit': '/dashboard/notifications/emailgatwaylist',
    '/dashboard/addtxnslab': '/dashboard/txtslablist',
  };
  if (
    normalizedPath === self ||
    (masterCrudParent !== normalizedPath && allowed.has(masterCrudParent)) ||
    allowed.has(pathname.toLowerCase()) ||
    allowed.has(inherited[pathname.toLowerCase()])
  )
    return <Outlet />;
  return (
    <div className="card state">
      <h1>Access denied</h1>
      <p>This page is not available for your account.</p>
      <Link to="/Dashboard">Return to dashboard</Link>
    </div>
  );
}
export function DashboardHome() {
  return <Navigate to="/Dashboard/UserDashboard" replace />;
}
