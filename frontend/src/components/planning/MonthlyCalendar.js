import React from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper
} from '@mui/material';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addDays,
  getDay
} from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Composant d'affichage du planning mensuel
 */
const MonthlyCalendar = ({ currentDate, planningData, onDaySelect, selectedDay }) => {
  // Obtenir le premier jour du mois
  const monthStart = startOfMonth(currentDate);
  
  // Obtenir le dernier jour du mois
  const monthEnd = endOfMonth(currentDate);
  
  // Obtenir tous les jours du mois
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Déterminer le premier jour de la semaine (lundi = 1, dimanche = 0)
  const startDay = getDay(monthStart) || 7; // Convertir dimanche (0) en 7
  
  // Jours de la semaine en français pour les en-têtes
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  
  // Créer des jours vides pour le début du mois si nécessaire
  const blanks = Array(startDay - 1).fill(null);
  
  // Créer le tableau de jours à afficher (jours vides + jours du mois)
  const calendarDays = [...blanks, ...daysInMonth];
  
  // Fonction pour obtenir la couleur de fond en fonction du service
  const getBackgroundColor = (day) => {
    if (!day) return 'transparent';
    
    const dayData = planningData.find(d => d.date && isSameDay(d.date, day));
    
    if (!dayData || !dayData.shift) return 'transparent';
    
    switch (dayData.shift) {
      case 'Matin':
        return '#bbdefb'; // Bleu clair
      case 'Après-midi':
        return '#c8e6c9'; // Vert clair
      case 'Nuit':
        return '#d1c4e9'; // Violet clair
      case 'Repos':
        return '#f5f5f5'; // Gris très clair
      default:
        return 'transparent';
    }
  };
  
  // Fonction pour déterminer si un jour a été modifié récemment
  const isModified = (day) => {
    if (!day) return false;
    
    const dayData = planningData.find(d => d.date && isSameDay(d.date, day));
    return dayData && dayData.isModified;
  };
  
  return (
    <Box>
      <Grid container>
        {/* En-têtes des jours de la semaine */}
        {weekDays.map((day, index) => (
          <Grid item xs={12/7} key={`header-${index}`}>
            <Box sx={{ 
              textAlign: 'center', 
              p: 1, 
              fontWeight: 'bold',
              borderBottom: 1,
              borderColor: 'divider'
            }}>
              {day}
            </Box>
          </Grid>
        ))}
        
        {/* Jours du calendrier */}
        {calendarDays.map((day, index) => (
          <Grid item xs={12/7} key={`day-${index}`}>
            <Paper
              elevation={isSameDay(day, selectedDay) ? 3 : 0}
              sx={{ 
                m: 0.5, 
                height: 80, 
                bgcolor: getBackgroundColor(day),
                border: isToday(day) ? 2 : 0,
                borderColor: 'primary.main',
                boxShadow: isSameDay(day, selectedDay) ? 3 : 0,
                cursor: day ? 'pointer' : 'default',
                overflow: 'hidden',
                position: 'relative',
                opacity: day && !isSameMonth(day, currentDate) ? 0.5 : 1
              }}
              onClick={() => day && onDaySelect(day)}
            >
              {day && (
                <>
                  <Box 
                    sx={{ 
                      p: 1, 
                      textAlign: 'right',
                      fontWeight: isToday(day) ? 'bold' : 'normal'
                    }}
                  >
                    {format(day, 'd')}
                  </Box>
                  
                  {/* Affichage du service */}
                  {planningData.find(d => d.date && isSameDay(d.date, day))?.shift && (
                    <Box sx={{ px: 1, fontSize: '0.75rem' }}>
                      {planningData.find(d => d.date && isSameDay(d.date, day))?.shift}
                    </Box>
                  )}
                  
                  {/* Indicateur de modification récente */}
                  {isModified(day) && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        right: 0, 
                        width: 0, 
                        height: 0, 
                        borderStyle: 'solid',
                        borderWidth: '0 20px 20px 0',
                        borderColor: 'transparent #ff9800 transparent transparent',
                      }}
                    />
                  )}
                </>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MonthlyCalendar;
