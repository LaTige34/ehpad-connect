import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  CalendarMonth,
  FileDownload,
  Email
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import des composants personnalisés
import MonthlyCalendar from '../../components/planning/MonthlyCalendar';
import WeeklyCalendar from '../../components/planning/WeeklyCalendar';
import PlanningDetails from '../../components/planning/PlanningDetails';

/**
 * Page de planning
 */
const PlanningPage = () => {
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  
  const dispatch = useDispatch();
  
  // Données simulées pour le tableau de bord
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Données de planning simulées
  const [planningData, setPlanningData] = useState([]);
  
  // Simuler le chargement des données
  useEffect(() => {
    setIsLoading(true);
    
    // Simuler un appel API
    setTimeout(() => {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Générer des données simulées pour chaque jour
      const data = daysInMonth.map(day => {
        const dayOfWeek = day.getDay();
        let shift = null;
        let hours = null;
        let department = null;
        
        // Weekends = repos
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          shift = 'Repos';
        } else {
          // Alterner les services du lundi au vendredi
          if (dayOfWeek % 2 === 1) {
            shift = 'Matin';
            hours = '7h - 15h';
            department = 'Service A';
          } else {
            shift = 'Après-midi';
            hours = '15h - 23h';
            department = 'Service B';
          }
        }
        
        return {
          date: day,
          shift,
          hours,
          department,
          isModified: Math.random() > 0.8 // 20% de chances d'être modifié
        };
      });
      
      setPlanningData(data);
      setIsLoading(false);
    }, 800);
  }, [currentDate]);
  
  // Gestion des changements de vue
  const handleViewChange = (event, newValue) => {
    setView(newValue);
  };
  
  // Navigation entre les mois
  const handlePreviousMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, -1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };
  
  // Sélection d'un jour
  const handleDaySelect = (day) => {
    setSelectedDay(day);
  };
  
  // Exporter le planning
  const handleExportPlanning = () => {
    alert('Export du planning en PDF (simulation)');
  };
  
  // Envoyer le planning par email
  const handleSendByEmail = () => {
    alert('Envoi du planning par email à mathieu.desobry@ehpadbelleviste.fr (simulation)');
  };
  
  // Trouver les détails du jour sélectionné
  const selectedDayDetails = planningData.find(day => 
    day.date && selectedDay && isSameDay(day.date, selectedDay)
  );
  
  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h4" component="h1">
              Mon Planning
            </Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<FileDownload />}
                onClick={handleExportPlanning}
                sx={{ mr: 1 }}
              >
                Exporter
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Email />}
                onClick={handleSendByEmail}
              >
                Envoyer par email
              </Button>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ mb: 3 }}>
            <Box p={2} display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <IconButton onClick={handlePreviousMonth}>
                  <NavigateBefore />
                </IconButton>
                <Typography variant="h6" sx={{ mx: 2 }}>
                  {format(currentDate, 'MMMM yyyy', { locale: fr })}
                </Typography>
                <IconButton onClick={handleNextMonth}>
                  <NavigateNext />
                </IconButton>
              </Box>
              
              <Tabs value={view} onChange={handleViewChange} aria-label="vue planning">
                <Tab value="month" label="Mois" icon={<CalendarMonth />} iconPosition="start" />
                <Tab value="week" label="Semaine" />
              </Tabs>
              
              <Box>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel id="service-select-label">Service</InputLabel>
                  <Select
                    labelId="service-select-label"
                    id="service-select"
                    value="all"
                    label="Service"
                    size="small"
                  >
                    <MenuItem value="all">Tous</MenuItem>
                    <MenuItem value="A">Service A</MenuItem>
                    <MenuItem value="B">Service B</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            {isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <>
                {view === 'month' ? (
                  <MonthlyCalendar 
                    currentDate={currentDate}
                    planningData={planningData}
                    onDaySelect={handleDaySelect}
                    selectedDay={selectedDay}
                  />
                ) : (
                  <WeeklyCalendar 
                    currentDate={currentDate}
                    planningData={planningData}
                    onDaySelect={handleDaySelect}
                    selectedDay={selectedDay}
                  />
                )}
              </>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Détails du jour
            </Typography>
            {selectedDayDetails ? (
              <PlanningDetails day={selectedDayDetails} />
            ) : (
              <Typography variant="body1" color="text.secondary">
                Sélectionnez un jour pour voir les détails
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Légende
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Chip label="Matin (7h-15h)" sx={{ backgroundColor: '#bbdefb' }} />
              <Chip label="Après-midi (15h-23h)" sx={{ backgroundColor: '#c8e6c9' }} />
              <Chip label="Nuit (23h-7h)" sx={{ backgroundColor: '#d1c4e9' }} />
              <Chip label="Repos" sx={{ backgroundColor: '#f5f5f5' }} />
              <Chip label="Modifié récemment" color="warning" />
              <Chip label="Jour sélectionné" color="primary" />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PlanningPage;
