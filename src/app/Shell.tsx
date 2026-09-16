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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fb' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #0e2f47 0%, #123b52 35%, #0d2d40 100%)',
            color: '#dfeef4',
            borderRight: 'none',
            px: 1.6,
            py: 2.5,
            boxShadow: '18px 0 35px rgba(11, 27, 39, 0.18)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, mb: 2.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'linear-gradient(135deg, #4ec7c3 0%, #2aa7a3 100%)',
              background: 'linear-gradient(135deg, #4ec7c3 0%, #2aa7a3 100%)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              boxShadow: '0 10px 22px rgba(53, 184, 176, 0.4)',
            }}
          >
            F
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: 0.4 }}>
            FINOVA
          </Typography>
        </Box>

        <Typography
          sx={{
            px: 1.5,
            mb: 2,
            fontSize: '0.68rem',
            letterSpacing: '0.18em',
            fontWeight: 700,
            color: '#b7d8e6',
            textTransform: 'uppercase',
          }}
        >
          FINOVA DASHBOARD
        </Typography>

        <List component="nav" disablePadding sx={{ width: '100%' }}>
          <ListItemButton
            component={NavLink}
            to={home}
            onClick={() => setOpen(false)}
            sx={{
              borderRadius: 2,
              minHeight: 52,
              color: '#dfeef4',
              mb: 0.8,
              background: 'rgba(255,255,255,0.02)',
              '&.active': {
                bgcolor: 'linear-gradient(90deg, rgba(78, 199, 195, 0.24), rgba(255,255,255,0.04))',
                color: '#fff',
                boxShadow: 'inset 0 0 0 1px rgba(124, 211, 219, 0.18)',
              },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
              <DashboardRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography sx={{ fontSize: '0.96rem', fontWeight: 600, color: 'inherit' }}>
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
                    borderRadius: 2,
                    minHeight: 52,
                    color: '#dfeef4',
                    background: 'rgba(255,255,255,0.02)',
                    '&.active': {
                      bgcolor:
                        'linear-gradient(90deg, rgba(78, 199, 195, 0.24), rgba(255,255,255,0.04))',
                      color: '#fff',
                      boxShadow: 'inset 0 0 0 1px rgba(124, 211, 219, 0.18)',
                    },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
                    {getMenuIcon(parent.Title)}
                  </ListItemIcon>
                  <ListItemText>
                    <Typography sx={{ fontSize: '0.96rem', fontWeight: 600, color: 'inherit' }}>
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
                            borderRadius: 2,
                            pl: 2.5,
                            py: 1,
                            minHeight: 44,
                            color: '#dfeef4',
                            '&.active': {
                              bgcolor: 'rgba(78, 199, 195, 0.14)',
                              color: '#fff',
                              boxShadow: 'inset 0 0 0 1px rgba(124, 211, 219, 0.14)',
                            },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 30, color: 'inherit' }}>
                            {getMenuIcon(child.Title)}
                          </ListItemIcon>
                          <ListItemText>
                            <Typography
                              sx={{ fontSize: '0.88rem', color: '#e5f4f8', fontWeight: 500 }}
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

        <Box sx={{ mt: 'auto', px: 1.5, pt: 3, color: '#dfeef4' }}>
          <Typography sx={{ fontWeight: 700 }}>FINOVA</Typography>
          <Typography sx={{ color: '#a9c6d5', fontSize: '0.8rem' }}>Business payments</Typography>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, ml: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: '#ffffff',
            color: '#123b52',
            borderBottom: '1px solid #dfe7ee',
            ml: 0,
          }}
        >
          <Toolbar sx={{ minHeight: 72, px: 3, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <button
                className="secondary menu-toggle"
                aria-label="Toggle navigation"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                style={{ marginRight: 8 }}
              >
                ☰
              </button>
              <Typography sx={{ fontWeight: 600 }}>Partner portal</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  bgcolor: '#ddf0ed',
                  color: '#246d66',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                }}
              >
                {session?.displayName.slice(0, 1).toUpperCase()}
              </Box>
              <Typography sx={{ fontWeight: 600 }}>{session?.displayName}</Typography>
              <button className="secondary" onClick={logout}>
                Sign out
              </button>
            </Box>
          </Toolbar>
        </AppBar>

        <Box id="main" tabIndex={-1} sx={{ p: 3, minHeight: 'calc(100vh - 72px)' }}>
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

        <Box sx={{ px: 3, pb: 2, color: '#586d7b', fontSize: '0.78rem' }}>
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
