import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Skeleton,
  Alert,
  Chip
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Description as DocumentIcon,
  Notifications as NotificationIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

// En environnement de production, nous importerions les services pour obtenir les données
// import planningService from '../services/planningService';
// import documentService from '../services/documentService';

/**
 * Page de tableau de bord
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Données simulées pour le développement
  const [data, setData] = useState({
    nextShifts: [],
    pendingDocuments: [],
    recentNotifications: []
  });
  
  useEffect(() => {
    // Simuler un chargement de données
    const loadData = async () => {
      try {
        // Dans une application réelle, ces données seraient chargées depuis les API
        // const planningResponse = await planningService.getNextShifts();
        // const documentsResponse = await documentService.getPendingDocuments();
        
        // Données simulées pour le développement
        setTimeout(() => {
          setData({
            nextShifts: [
              { id: 1, date: '2025-03-02', shift: 'Matin', hours: '7h - 15h', service: 'Service A' },
              { id: 2, date: '2025-03-03', shift: 'Après-midi', hours: '15h - 23h', service: 'Service B' },
              { id: 3, date: '2025-03-05', shift: 'Matin', hours: '7h - 15h', service: 'Service A' }
            ],
            pendingDocuments: [
              { id: 1, title: 'Avenant au contrat', createdAt: '2025-02-28', status: 'pending' },
              { id: 2, title: 'Planning Mars 2025', createdAt: '2025-02-29', status: 'pending' }
            ],
            recentNotifications: [
              { id: 1, message: 'Votre planning a été mis à jour', createdAt: '2025-03-01T09:15:00Z', read: false },
              { id: 2, message: 'Nouveau document à signer', createdAt: '2025-02-29T14:30:00Z', read: false }
            ]
          });
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger les données. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tableau de bord
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bienvenue, {user?.name || 'Utilisateur'}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Prochains services */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Prochains services</Typography>
              </Box>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />} 
                onClick={() => navigate('/planning')}
              >
                Voir tout
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              Array(3).fill().map((_, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Skeleton variant="text" width="60%" height={30} />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="30%" />
                </Box>
              ))
            ) : data.nextShifts.length > 0 ? (
              <List sx={{ p: 0 }}>
                {data.nextShifts.map(shift => (
                  <ListItem 
                    key={shift.id} 
                    alignItems="flex-start" 
                    sx={{ px: 0, py: 1 }}
                    divider
                  >
                    <ListItemText
                      primary={formatDate(shift.date)}
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {shift.hours} - {shift.service}
                          </Typography>
                          <br />
                          <Chip 
                            label={shift.shift} 
                            size="small" 
                            color={shift.shift === 'Matin' ? 'primary' : 'secondary'} 
                            sx={{ mt: 0.5 }}
                          />
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Aucun service à venir.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Documents en attente */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DocumentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Documents à signer</Typography>
              </Box>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />} 
                onClick={() => navigate('/documents')}
              >
                Voir tout
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ mb: 2 }}>
                <Skeleton variant="rectangular" height={120} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={120} />
              </Box>
            ) : data.pendingDocuments.length > 0 ? (
              <Grid container spacing={2}>
                {data.pendingDocuments.map(doc => (
                  <Grid item xs={12} key={doc.id}>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="h6" component="div">
                          {doc.title}
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                          Ajouté le {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small"
                          onClick={() => navigate(`/documents/${doc.id}`)}
                        >
                          Consulter
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained" 
                          onClick={() => navigate(`/documents/${doc.id}/sign`)}
                        >
                          Signer
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Aucun document en attente de signature.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Notifications récentes */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Notifications récentes</Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              Array(2).fill().map((_, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="30%" />
                </Box>
              ))
            ) : data.recentNotifications.length > 0 ? (
              <List sx={{ p: 0 }}>
                {data.recentNotifications.map(notification => (
                  <ListItem 
                    key={notification.id} 
                    alignItems="flex-start" 
                    sx={{ px: 0, py: 1 }}
                    divider
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <NotificationIcon color={notification.read ? 'disabled' : 'primary'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.message}
                      secondary={new Date(notification.createdAt).toLocaleString('fr-FR')}
                      primaryTypographyProps={{
                        fontWeight: notification.read ? 'normal' : 'bold'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Aucune notification récente.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
