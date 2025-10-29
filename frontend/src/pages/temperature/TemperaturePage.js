import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Kitchen as KitchenIcon
} from '@mui/icons-material';
import TemperatureLogForm from '../../components/TemperatureLogForm';
import TemperatureMonitoring from '../../components/TemperatureMonitoring';
import temperatureService from '../../services/temperatureService';

/**
 * Page principale de gestion de la surveillance de température
 */
const TemperaturePage = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [refrigerators, setRefrigerators] = useState([]);
  const [selectedRefrigerator, setSelectedRefrigerator] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les réfrigérateurs
  useEffect(() => {
    loadRefrigerators();
    loadAnomalies();
  }, []);

  const loadRefrigerators = async () => {
    try {
      const response = await temperatureService.getRefrigerators();
      const fridges = response.data || [];
      setRefrigerators(fridges);

      if (fridges.length > 0) {
        setSelectedRefrigerator(fridges[0].refrigeratorId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAnomalies = async () => {
    try {
      const response = await temperatureService.getAnomalies(null, 7);
      setAnomalies(response.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des anomalies:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleFormSuccess = () => {
    // Recharger les données après ajout d'un relevé
    loadRefrigerators();
    loadAnomalies();
    // Passer à l'onglet de suivi
    setCurrentTab(1);
  };

  // Générer les années disponibles
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear; i++) {
    years.push(i);
  }

  // Mois en français
  const months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Surveillance de Température
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Suivi de la température des produits thermosensibles - Référentiel HAS
        </Typography>
      </Box>

      {/* Erreur globale */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Alertes anomalies */}
      {anomalies.length > 0 && currentTab === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            {anomalies.length} anomalie(s) détectée(s) dans les 7 derniers jours
          </Typography>
          <List dense>
            {anomalies.slice(0, 3).map((anomaly) => (
              <ListItem key={anomaly.id}>
                <ListItemIcon>
                  <WarningIcon color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`${anomaly.refrigeratorId} - ${anomaly.temperature}°C`}
                  secondary={`${new Date(anomaly.measurementDate).toLocaleDateString('fr-FR')} ${anomaly.measurementTime}`}
                />
                <Chip
                  label={anomaly.alertLevel}
                  color={anomaly.alertLevel === 'critical' ? 'error' : 'warning'}
                  size="small"
                />
              </ListItem>
            ))}
          </List>
          {anomalies.length > 3 && (
            <Typography variant="caption" color="textSecondary">
              ... et {anomalies.length - 3} autre(s)
            </Typography>
          )}
        </Alert>
      )}

      {/* Onglets principaux */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} centered>
          <Tab label="Nouveau relevé" icon={<AddIcon />} iconPosition="start" />
          <Tab label="Suivi et statistiques" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="Réfrigérateurs" icon={<KitchenIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Contenu des onglets */}
      <Box>
        {/* Onglet 1: Nouveau relevé */}
        {currentTab === 0 && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Réfrigérateur</InputLabel>
                  <Select
                    value={selectedRefrigerator}
                    onChange={(e) => setSelectedRefrigerator(e.target.value)}
                    label="Réfrigérateur"
                  >
                    {refrigerators.map((fridge) => (
                      <MenuItem key={fridge.refrigeratorId} value={fridge.refrigeratorId}>
                        {fridge.refrigeratorId} - {fridge.location}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {selectedRefrigerator && (
              <TemperatureLogForm
                refrigerator={refrigerators.find(f => f.refrigeratorId === selectedRefrigerator)}
                onSuccess={handleFormSuccess}
              />
            )}

            {refrigerators.length === 0 && (
              <Alert severity="info">
                Aucun réfrigérateur enregistré. Veuillez effectuer un premier relevé pour créer une fiche.
              </Alert>
            )}
          </Box>
        )}

        {/* Onglet 2: Suivi et statistiques */}
        {currentTab === 1 && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Réfrigérateur</InputLabel>
                  <Select
                    value={selectedRefrigerator}
                    onChange={(e) => setSelectedRefrigerator(e.target.value)}
                    label="Réfrigérateur"
                  >
                    {refrigerators.map((fridge) => (
                      <MenuItem key={fridge.refrigeratorId} value={fridge.refrigeratorId}>
                        {fridge.refrigeratorId}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Année</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    label="Année"
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Mois</InputLabel>
                  <Select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    label="Mois"
                  >
                    {months.map((month) => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {selectedRefrigerator && (
              <TemperatureMonitoring
                refrigeratorId={selectedRefrigerator}
                year={selectedYear}
                month={selectedMonth}
              />
            )}
          </Box>
        )}

        {/* Onglet 3: Réfrigérateurs */}
        {currentTab === 2 && (
          <Grid container spacing={2}>
            {refrigerators.map((fridge) => (
              <Grid item xs={12} sm={6} md={4} key={fridge.refrigeratorId}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <KitchenIcon sx={{ mr: 1 }} color="primary" />
                      <Typography variant="h6">
                        {fridge.refrigeratorId}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {fridge.location}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Dernier relevé: {fridge.lastMeasurement ?
                        new Date(fridge.lastMeasurement).toLocaleDateString('fr-FR') :
                        'Aucun'}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Total relevés: {fridge.totalLogs || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {refrigerators.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Aucun réfrigérateur enregistré pour le moment.
                </Alert>
              </Grid>
            )}
          </Grid>
        )}
      </Box>

      {/* Recommandations HAS */}
      <Paper sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
          Recommandations HAS
        </Typography>
        <Typography variant="caption" display="block" gutterBottom>
          • Maintenir la température entre +2°C et +8°C
        </Typography>
        <Typography variant="caption" display="block" gutterBottom>
          • Effectuer 2 relevés par jour minimum (matin et soir)
        </Typography>
        <Typography variant="caption" display="block" gutterBottom>
          • En cas de dépassement, contacter immédiatement le responsable
        </Typography>
        <Typography variant="caption" display="block">
          • Archiver les fiches mensuelles pendant 3 ans minimum
        </Typography>
      </Paper>
    </Container>
  );
};

export default TemperaturePage;
