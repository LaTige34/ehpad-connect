import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar
} from '@mui/material';
import { 
  CalendarMonth as CalendarIcon,
  Description as DocumentIcon,
  Notifications as NotificationIcon,
  AccessTime as TimeIcon,
  Event as EventIcon,
  Assignment as TaskIcon
} from '@mui/icons-material';

/**
 * Page de tableau de bord
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // État utilisateur (simulé pour le moment)
  const user = useSelector(state => state.auth.user) || {
    name: 'Utilisateur Test',
    role: 'employee',
    department: 'Service A'
  };
  
  // Données simulées pour le dashboard
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(currentDate);
  
  // Données simulées de planification pour aujourd'hui
  const todaySchedule = {
    date: formattedDate,
    shift: 'Matin',
    hours: '7h - 15h',
    department: 'Service A',
    team: 'Équipe 2'
  };
  
  // Documents en attente de signature (simulés)
  const pendingDocuments = [
    {
      id: 1,
      title: 'Avenant au contrat',
      date: '28/02/2025',
      type: 'contract',
      status: 'pending'
    }
  ];
  
  // Notifications récentes (simulées)
  const recentNotifications = [
    {
      id: 1,
      title: 'Modification du planning',
      message: 'Votre service du 15/03 a été modifié',
      date: '01/03/2025',
      read: false
    },
    {
      id: 2,
      title: 'Nouveau document disponible',
      message: 'Un avenant à votre contrat est disponible',
      date: '28/02/2025',
      read: false
    }
  ];
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Tableau de bord
      </Typography>
      
      <Box sx={{ my: 2 }}>
        <Typography variant="h6" color="text.secondary">
          Bonjour, {user.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {formattedDate}
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Planning du jour */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <CalendarIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Planning du jour</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {todaySchedule ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">
                    {todaySchedule.shift} ({todaySchedule.hours})
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">
                    {todaySchedule.department}, {todaySchedule.team}
                  </Typography>
                </Box>
                
                <Button 
                  variant="outlined" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/planning')}
                >
                  Voir mon planning complet
                </Button>
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Aucun service prévu aujourd'hui
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Documents en attente */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <DocumentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Documents à signer</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {pendingDocuments.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {pendingDocuments.map((doc) => (
                  <ListItem
                    key={doc.id}
                    secondaryAction={
                      <Chip 
                        label="À signer" 
                        color="warning" 
                        size="small" 
                      />
                    }
                    sx={{ px: 0 }}
                  >
                    <ListItemIcon>
                      <TaskIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.title}
                      secondary={`Ajouté le ${doc.date}`}
                    />
                  </ListItem>
                ))}
                <Box sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => navigate('/documents/2/sign')}
                    fullWidth
                  >
                    Signer maintenant
                  </Button>
                </Box>
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Aucun document en attente de signature
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Notifications récentes */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <NotificationIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Notifications récentes</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {recentNotifications.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {recentNotifications.map((notification) => (
                  <ListItem
                    key={notification.id}
                    secondaryAction={
                      !notification.read && (
                        <Chip 
                          label="Nouveau" 
                          color="info" 
                          size="small" 
                        />
                      )
                    }
                  >
                    <ListItemIcon>
                      {notification.title.includes('planning') ? (
                        <CalendarIcon color="primary" />
                      ) : (
                        <DocumentIcon color="primary" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <>
                          {notification.message}
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {notification.date}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Aucune notification récente
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
