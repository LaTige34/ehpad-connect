import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper 
} from '@mui/material';
import { SentimentDissatisfied } from '@mui/icons-material';

/**
 * Page 404 - Page non trouvée
 */
const NotFound = () => {
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 5, mt: 10, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <SentimentDissatisfied color="primary" sx={{ fontSize: 80, mb: 2 }} />
          
          <Typography variant="h3" component="h1" gutterBottom>
            404
          </Typography>
          
          <Typography variant="h5" component="h2" gutterBottom>
            Page non trouvée
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            La page que vous recherchez n'existe pas ou a été déplacée.
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/"
              sx={{ mr: 1 }}
            >
              Retour à l'accueil
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              component={RouterLink}
              to="/planning"
            >
              Voir mon planning
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Si le problème persiste, veuillez contacter le support technique.
        </Typography>
      </Paper>
    </Container>
  );
};

export default NotFound;
