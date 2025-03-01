import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Skeleton,
  Alert,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  HourglassTop as HourglassTopIcon,
  Check as CheckIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Page de planning
 */
const PlanningPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tabValue, setTabValue] = useState(0);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  
  // Données simulées pour le développement
  const [planning, setPlanning] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const user = useSelector(state => state.auth.user);
  
  useEffect(() => {
    // Simuler le chargement du planning
    const loadPlanning = async () => {
      try {
        // Dans une application réelle, ces données seraient chargées depuis l'API
        // const response = await planningService.getMonthlyPlanning(format(currentDate, 'yyyy-MM'));
        
        // Données simulées pour le développement
        setTimeout(() => {
          // Générer des données pour chaque jour du mois
          const start = startOfMonth(currentDate);
          const end = endOfMonth(currentDate);
          const days = eachDayOfInterval({ start, end });
          
          const shifts = ['Matin', 'Après-midi', 'Nuit', 'Repos'];
          const services = ['Service A', 'Service B', 'Service C'];
          const hours = {
            'Matin': '7h - 15h',
            'Après-midi': '15h - 23h',
            'Nuit': '23h - 7h',
            'Repos': ''
          };
          
          const generatedPlanning = days.map(day => {
            // Pas de service le weekend (70% de chances)
            if (isWeekend(day) && Math.random() < 0.7) {
              return {
                date: format(day, 'yyyy-MM-dd'),
                shift: 'Repos',
                hours: '',
                service: '',
                status: 'confirmed'
              };
            }
            
            const shiftIndex = Math.floor(Math.random() * 4); // 0-3
            const shift = shifts[shiftIndex];
            
            return {
              date: format(day, 'yyyy-MM-dd'),
              shift,
              hours: hours[shift],
              service: shift === 'Repos' ? '' : services[Math.floor(Math.random() * services.length)],
              status: Math.random() < 0.8 ? 'confirmed' : 'pending'
            };
          });
          
          setPlanning(generatedPlanning);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Erreur lors du chargement du planning:', err);
        setError('Impossible de charger le planning. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };
    
    setLoading(true);
    loadPlanning();
  }, [currentDate]);
  
  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  const handleDownload = () => {
    // Dans une application réelle, cette fonction téléchargerait le planning
    alert('Téléchargement du planning au format PDF');
  };
  
  const handleDayClick = (day) => {
    // Trouver le shift pour ce jour
    const shift = planning.find(p => p.date === format(day, 'yyyy-MM-dd'));
    if (shift) {
      setSelectedShift(shift);
      setDialogOpen(true);
    }
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedShift(null);
  };
  
  const renderCalendar = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    // Créer une grille 7x6 pour le calendrier
    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    const getShiftForDay = (day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return planning.find(p => p.date === dateStr);
    };
    
    const getShiftColor = (shift) => {
      if (!shift) return 'grey.200';
      
      switch (shift.shift) {
        case 'Matin': return 'primary.light';
        case 'Après-midi': return 'secondary.light';
        case 'Nuit': return 'info.light';
        case 'Repos': return 'grey.100';
        default: return 'grey.200';
      }
    };
    
    const getShiftTextColor = (shift) => {
      if (!shift) return 'text.primary';
      
      switch (shift.shift) {
        case 'Matin': return 'primary.dark';
        case 'Après-midi': return 'secondary.dark';
        case 'Nuit': return 'info.dark';
        default: return 'text.primary';
      }
    };
    
    return (
      <Box>
        {/* En-têtes des jours de la semaine */}
        <Grid container>
          {weekDays.map(day => (
            <Grid item xs key={day} sx={{ textAlign: 'center', py: 1, fontWeight: 'bold' }}>
              {day}
            </Grid>
          ))}
        </Grid>
        
        {/* Jours du mois */}
        <Grid container>
          {/* Espaces vides pour aligner les jours correctement */}
          {Array.from({ length: start.getDay() === 0 ? 6 : start.getDay() - 1 }).map((_, i) => (
            <Grid item xs key={`empty-${i}`} sx={{ height: 90 }}></Grid>
          ))}
          
          {/* Jours du mois */}
          {days.map(day => {
            const shift = getShiftForDay(day);
            
            return (
              <Grid item xs key={format(day, 'yyyy-MM-dd')} sx={{ position: 'relative' }}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    height: 90,
                    p: 1, 
                    m: 0.5,
                    backgroundColor: getShiftColor(shift),
                    color: getShiftTextColor(shift),
                    border: isSameDay(day, new Date()) ? '2px solid' : 'none',
                    borderColor: 'primary.main',
                    cursor: 'pointer',
                    '&:hover': {
                      elevation: 2,
                      opacity: 0.9
                    }
                  }}
                  onClick={() => handleDayClick(day)}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {format(day, 'd')}
                  </Typography>
                  
                  {loading ? (
                    <Box>
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width="60%" />
                    </Box>
                  ) : shift ? (
                    <>
                      <Typography variant="caption" display="block" fontWeight="bold">
                        {shift.shift}
                      </Typography>
                      {shift.hours && (
                        <Typography variant="caption" display="block">
                          {shift.hours}
                        </Typography>
                      )}
                      {shift.service && (
                        <Typography variant="caption" display="block">
                          {shift.service}
                        </Typography>
                      )}
                      
                      {shift.status === 'pending' && (
                        <Tooltip title="En attente de validation">
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 5,
                              right: 5,
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: 'warning.main'
                            }}
                          />
                        </Tooltip>
                      )}
                    </>
                  ) : null}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };
  
  const renderListView = () => {
    // Filtrer les jours qui ont un service (pas de repos)
    const workDays = planning.filter(p => p.shift !== 'Repos');
    
    return (
      <Box sx={{ mt: 2 }}>
        {workDays.map((day) => (
          <Card key={day.date} sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <Typography variant="h6">
                    {format(parseISO(day.date), 'EEEE d MMMM', { locale: fr })}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Chip 
                    label={day.shift} 
                    color={
                      day.shift === 'Matin' ? 'primary' : 
                      day.shift === 'Après-midi' ? 'secondary' : 
                      'info'
                    }
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body1">{day.hours}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">{day.service}</Typography>
                  {day.status === 'pending' && (
                    <Chip 
                      size="small" 
                      icon={<HourglassTopIcon />} 
                      label="En attente" 
                      color="warning" 
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
        
        {workDays.length === 0 && (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
            Aucun jour travaillé ce mois-ci.
          </Typography>
        )}
      </Box>
    );
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Planning
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Contrôles de navigation et filtres */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item>
            <IconButton onClick={handlePreviousMonth} disabled={loading}>
              <ChevronLeftIcon />
            </IconButton>
            <IconButton onClick={handleNextMonth} disabled={loading}>
              <ChevronRightIcon />
            </IconButton>
          </Grid>
          
          <Grid item>
            <Typography variant="h5">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </Typography>
          </Grid>
          
          <Grid item>
            <Button 
              size="small" 
              startIcon={<TodayIcon />} 
              onClick={handleToday}
              disabled={loading}
            >
              Aujourd'hui
            </Button>
          </Grid>
          
          <Grid item sx={{ flexGrow: 1 }}></Grid>
          
          <Grid item>
            <Button 
              size="small" 
              startIcon={<FilterIcon />} 
              onClick={handleFilterClick}
              disabled={loading}
            >
              Filtrer
            </Button>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
            >
              <MenuItem onClick={handleFilterClose}>Tous</MenuItem>
              <MenuItem onClick={handleFilterClose}>Matin</MenuItem>
              <MenuItem onClick={handleFilterClose}>Après-midi</MenuItem>
              <MenuItem onClick={handleFilterClose}>Nuit</MenuItem>
              <MenuItem onClick={handleFilterClose}>Jours travaillés</MenuItem>
            </Menu>
          </Grid>
          
          <Grid item>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />} 
              onClick={handleDownload}
              disabled={loading}
            >
              Télécharger
            </Button>
          </Grid>
        </Grid>
        
        {/* Onglets vue calendrier / vue liste */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="vues du planning">
            <Tab label="Vue calendrier" id="tab-0" />
            <Tab label="Vue liste" id="tab-1" />
          </Tabs>
        </Box>
        
        {/* Contenu du planning */}
        <Box role="tabpanel" hidden={tabValue !== 0}>
          {tabValue === 0 && renderCalendar()}
        </Box>
        
        <Box role="tabpanel" hidden={tabValue !== 1}>
          {tabValue === 1 && renderListView()}
        </Box>
      </Paper>
      
      {/* Légende */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Légende :
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Chip label="Matin" color="primary" size="small" />
          </Grid>
          <Grid item>
            <Chip label="Après-midi" color="secondary" size="small" />
          </Grid>
          <Grid item>
            <Chip label="Nuit" color="info" size="small" />
          </Grid>
          <Grid item>
            <Chip 
              icon={<HourglassTopIcon />} 
              label="En attente" 
              color="warning" 
              variant="outlined"
              size="small" 
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Dialogue de détail du jour */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        {selectedShift && (
          <>
            <DialogTitle>
              {format(parseISO(selectedShift.date), 'EEEE d MMMM yyyy', { locale: fr })}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Service :</Typography>
                  <Typography variant="body1">{selectedShift.shift}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Horaires :</Typography>
                  <Typography variant="body1">{selectedShift.hours || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Unité :</Typography>
                  <Typography variant="body1">{selectedShift.service || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Statut :</Typography>
                  <Chip 
                    icon={selectedShift.status === 'confirmed' ? <CheckIcon /> : <HourglassTopIcon />}
                    label={selectedShift.status === 'confirmed' ? 'Confirmé' : 'En attente de validation'} 
                    color={selectedShift.status === 'confirmed' ? 'success' : 'warning'} 
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogClose}>
                Fermer
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  alert(`Téléchargement du planning pour le ${format(parseISO(selectedShift.date), 'dd/MM/yyyy')}`);
                  handleDialogClose();
                }}
              >
                Exporter
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PlanningPage;
