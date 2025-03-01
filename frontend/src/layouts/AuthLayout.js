import React from 'react';
import { Box, Container, Paper, Typography, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';

/**
 * Layout pour les pages d'authentification (connexion, mot de passe oublié, etc.)
 */
const AuthLayout = ({ children }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
      }}
    >
      <Container 
        component="main" 
        maxWidth="xs"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          flexGrow: 1,
          py: 8
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4
          }}
        >
          <Typography 
            component="h1" 
            variant="h4" 
            color="white" 
            fontWeight="bold"
            sx={{ mb: 1 }}
          >
            EHPAD Connect
          </Typography>
          <Typography variant="subtitle1" color="white" align="center">
            Accès aux plannings et documents RH
          </Typography>
        </Box>
        
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2
          }}
        >
          {children}
        </Paper>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="white" sx={{ mt: 2 }}>
            © {new Date().getFullYear()} EHPAD Belleviste. Tous droits réservés.
          </Typography>
          <Typography variant="body2" color="white" sx={{ mt: 1 }}>
            <Link to="/privacy-policy" style={{ color: 'white', textDecoration: 'underline' }}>
              Politique de confidentialité
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthLayout;
