import React, { useState } from "react";
import {
  AppBar, Toolbar, Typography, Button, IconButton, Box, Avatar,
  Menu, MenuItem, Divider, Badge, Chip, Drawer, List, ListItem,
  ListItemIcon, ListItemText, ListItemButton,
} from "@mui/material";
import {
  MenuBook, Login, Logout, Person, AdminPanelSettings,
  Notifications, Home, Menu as MenuIcon, Close,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header({ onOpenAuth, notifCount = 0 }) {
  const { session, signOut, isAdmin, isLogged } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl]     = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMenuOpen  = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    setDrawerOpen(false);
    signOut();
    navigate("/");
  };

  const goTo = (path) => { navigate(path); setDrawerOpen(false); };

  const MobileDrawer = (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      PaperProps={{ sx: { width: 280, borderRadius: "0 16px 16px 0" } }}
    >
      <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(167,139,250,0.2)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }} onClick={() => goTo("/")}>
          <MenuBook sx={{ color: "primary.main", fontSize: 24 }} />
          <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: "-0.02em" }}>
            Biblioteca<span style={{ color: "#A78BFA" }}>Digital</span>
          </Typography>
        </Box>
        <IconButton size="small" onClick={() => setDrawerOpen(false)}><Close fontSize="small" /></IconButton>
      </Box>

      {isLogged && (
        <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 42, height: 42, fontWeight: 700, fontSize: 16, bgcolor: isAdmin ? "secondary.main" : "primary.main" }}>
            {session.username[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>{session.username}</Typography>
            <Chip label={session.cargo} size="small" color={isAdmin ? "secondary" : "primary"} sx={{ height: 18, fontSize: 10, mt: 0.25 }} />
          </Box>
        </Box>
      )}

      <Divider />

      <List sx={{ py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => goTo("/")} selected={location.pathname === "/"} sx={{ borderRadius: 2, mx: 1 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Home fontSize="small" color={location.pathname === "/" ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText primary="Início" primaryTypographyProps={{ fontWeight: location.pathname === "/" ? 600 : 400, color: location.pathname === "/" ? "primary.main" : "text.primary" }} />
          </ListItemButton>
        </ListItem>

        {isLogged && !isAdmin && (
          <ListItem disablePadding>
            <ListItemButton onClick={() => goTo("/perfil")} selected={location.pathname === "/perfil"} sx={{ borderRadius: 2, mx: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Badge badgeContent={notifCount} color="error">
                  <Person fontSize="small" color={location.pathname === "/perfil" ? "primary" : "inherit"} />
                </Badge>
              </ListItemIcon>
              <ListItemText primary="Meu Perfil" primaryTypographyProps={{ fontWeight: location.pathname === "/perfil" ? 600 : 400, color: location.pathname === "/perfil" ? "primary.main" : "text.primary" }} />
            </ListItemButton>
          </ListItem>
        )}

        {isLogged && isAdmin && (
          <ListItem disablePadding>
            <ListItemButton onClick={() => goTo("/admin")} selected={location.pathname === "/admin"} sx={{ borderRadius: 2, mx: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <AdminPanelSettings fontSize="small" color={location.pathname === "/admin" ? "primary" : "inherit"} />
              </ListItemIcon>
              <ListItemText primary="Painel Admin" primaryTypographyProps={{ fontWeight: location.pathname === "/admin" ? 600 : 400, color: location.pathname === "/admin" ? "primary.main" : "text.primary" }} />
            </ListItemButton>
          </ListItem>
        )}
      </List>

      <Divider />
      <Box sx={{ px: 2, py: 2 }}>
        {isLogged ? (
          <Button fullWidth variant="outlined" color="error" size="small" startIcon={<Logout fontSize="small" />} onClick={handleLogout} sx={{ borderRadius: 2 }}>
            Sair
          </Button>
        ) : (
          <Button fullWidth variant="contained" size="small" startIcon={<Login fontSize="small" />} onClick={() => { onOpenAuth(); setDrawerOpen(false); }} sx={{ borderRadius: 2 }}>
            Entrar
          </Button>
        )}
      </Box>
    </Drawer>
  );

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ maxWidth: 1200, width: "100%", mx: "auto", px: { xs: 1.5, md: 4 } }}>
          <IconButton size="small" edge="start" onClick={() => setDrawerOpen(true)} sx={{ display: { xs: "flex", md: "none" }, mr: 1, color: "text.secondary" }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", flex: 1 }} onClick={() => navigate("/")}>
            <MenuBook sx={{ color: "primary.main", fontSize: { xs: 22, md: 28 } }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", letterSpacing: "-0.02em", fontSize: { xs: "1rem", md: "1.25rem" } }}>
              Biblioteca<span style={{ color: "#A78BFA" }}>Digital</span>
            </Typography>
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, alignItems: "center" }}>
            <Button onClick={() => navigate("/")} startIcon={<Home fontSize="small" />} sx={{ color: location.pathname === "/" ? "primary.main" : "text.secondary", fontWeight: location.pathname === "/" ? 600 : 400 }}>
              Início
            </Button>
            {isLogged && isAdmin && (
              <Button onClick={() => navigate("/admin")} startIcon={<AdminPanelSettings fontSize="small" />} sx={{ color: location.pathname === "/admin" ? "primary.main" : "text.secondary", fontWeight: location.pathname === "/admin" ? 600 : 400 }}>
                Painel Admin
              </Button>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: { xs: 0, md: 2 } }}>
            {isLogged ? (
              <>
                {!isAdmin && (
                  <IconButton onClick={() => navigate("/perfil")} size="small" sx={{ color: "text.secondary", display: { xs: "none", md: "flex" } }}>
                    <Badge badgeContent={notifCount} color="error">
                      <Notifications fontSize="small" />
                    </Badge>
                  </IconButton>
                )}
                <IconButton onClick={handleMenuOpen} size="small" sx={{ display: { xs: "none", md: "flex" } }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: isAdmin ? "secondary.main" : "primary.main", fontSize: 13, fontWeight: 700 }}>
                    {session.username[0].toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
                  PaperProps={{ sx: { mt: 1, minWidth: 200, borderRadius: 3, border: "1px solid rgba(167,139,250,0.2)" } }}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>{session.username}</Typography>
                    <Chip label={session.cargo} size="small" color={isAdmin ? "secondary" : "primary"} sx={{ mt: 0.5, height: 20, fontSize: 11 }} />
                  </Box>
                  <Divider />
                  {!isAdmin && (
                    <MenuItem onClick={() => { handleMenuClose(); navigate("/perfil"); }}>
                      <Person fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
                      Meu Perfil
                    </MenuItem>
                  )}
                  {isAdmin && (
                    <MenuItem onClick={() => { handleMenuClose(); navigate("/admin"); }}>
                      <AdminPanelSettings fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
                      Painel Admin
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                    <Logout fontSize="small" sx={{ mr: 1.5 }} />
                    Sair
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button variant="contained" startIcon={<Login />} onClick={onOpenAuth} size="small" sx={{ display: { xs: "none", md: "flex" } }}>
                Entrar
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      {MobileDrawer}
      <Toolbar />
    </>
  );
}
