import React from 'react';
import { 
  Container, 
  Box, 
  Paper, 
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link } from 'react-router-dom';

/**
 * Layout utilisé pour les pages d'authentification (login, mot de passe oublié, etc.)
 */
const AuthLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default
      }}
    >
      {/* En-tête */}
      <Box 
        component="header" 
        sx={{ 
          p: 2, 
          backgroundColor: theme.palette.primary.main,
          color: 'white'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
              EHPAD Belleviste
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Contenu principal */}
      <Container 
        component="main" 
        maxWidth="sm" 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: isMobile ? 3 : 4,
            borderRadius: 2
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              color="primary" 
              fontWeight="500"
              gutterBottom
            >
              EHPAD Connect
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Accès aux plannings et documents RH
            </Typography>
          </Box>

          {children}
        </Paper>
      </Container>

      {/* Pied de page */}
      <Box 
        component="footer" 
        sx={{ 
          py: 2, 
          textAlign: 'center',
          backgroundColor: theme.palette.grey[100]
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary">
            © 2025 EHPAD Belleviste - Tous droits réservés
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Link to="/help" style={{ color: theme.palette.text.secondary, marginRight: 16, fontSize: '0.875rem', textDecoration: 'none' }}>
              Aide
            </Link>
            <Link to="/mentions-legales" style={{ color: theme.palette.text.secondary, fontSize: '0.875rem', textDecoration: 'none' }}>
              Mentions légales
            </Link>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default AuthLayout;
