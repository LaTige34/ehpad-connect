import React from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Divider,
  Button,
  Grid,
  Paper,
  Alert
} from '@mui/material';
import { 
  AccessTime as TimeIcon,
  Place as PlaceIcon,
  Group as TeamIcon,
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  EventNote as NoteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Composant affichant les détails d'un jour sélectionné dans le planning
 */
const PlanningDetails = ({ day }) => {
  if (!day || !day.date) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Aucun jour sélectionné
        </Typography>
      </Box>
    );
  }
  
  // Formatage de la date
  const formattedDate = format(day.date, 'EEEE d MMMM yyyy', { locale: fr });
  
  // Style de couleur selon le service
  const getServiceColor = () => {
    switch (day.shift) {
      case 'Matin':
        return '#bbdefb'; // Bleu clair
      case 'Après-midi':
        return '#c8e6c9'; // Vert clair
      case 'Nuit':
        return '#d1c4e9'; // Violet clair
      case 'Repos':
        return '#f5f5f5'; // Gris très clair
      default:
        return '#f5f5f5';
    }
  };
  
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" component="div" sx={{ mb: 1 }}>
          {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        </Typography>
        
        <Chip 
          label={day.shift} 
          sx={{ 
            backgroundColor: getServiceColor(),
            fontWeight: 'bold'
          }} 
        />
        
        {day.isModified && (
          <Alert severity="warning" sx={{ mt: 2, fontSize: '0.875rem' }}>
            Ce planning a été modifié récemment
          </Alert>
        )}
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {day.shift !== 'Repos' ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
              <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1">
                Horaires: {day.hours}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
              <PlaceIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1">
                Service: {day.department}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
              <TeamIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1">
                Équipe: Équipe A
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" alignItems="flex-start" sx={{ mb: 1 }}>
              <NoteIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Notes:
                </Typography>
                <Typography variant="body2">
                  {day.notes || "Aucune note spécifique pour ce jour."}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
              <EditIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Dernière modification: {day.isModified ? '01/03/2025' : 'N/A'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              startIcon={<CalendarIcon />}
            >
              Demander un changement
            </Button>
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="body1">
            Journée de repos
          </Typography>
        </Box>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Information générale: Les horaires peuvent être soumis à modification selon les besoins du service.
        </Typography>
      </Box>
    </Box>
  );
};

export default PlanningDetails;
