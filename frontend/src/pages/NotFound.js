import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

/**
 * Page 404 pour les routes inexistantes
 */
const NotFound = () => {
  return (
    <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          color="primary"
          sx={{ fontSize: { xs: '4rem', md: '8rem' }, fontWeight: 700, mb: 2 }}
        >
          404
        </Typography>
        
        <Typography variant="h4" component="h2" gutterBottom>
          Page introuvable
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '600px' }}>
          La page que vous recherchez n'existe pas. Elle a peut-être été déplacée, supprimée,
          ou n'a jamais existé. Vérifiez l'URL ou retournez à l'accueil.
        </Typography>
        
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
          sx={{ py: 1.5, px: 3, fontSize: '1rem' }}
        >
          Retour à l'accueil
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFound;
