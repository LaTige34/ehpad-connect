import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
  Grid,
  CircularProgress
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import temperatureService from '../services/temperatureService';

/**
 * Formulaire de saisie d'un relevé de température
 */
const TemperatureLogForm = ({ refrigerator, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    refrigeratorId: refrigerator?.refrigeratorId || '',
    location: refrigerator?.location || 'Salle de soins - IDE',
    measurementDate: new Date().toISOString().split('T')[0],
    measurementTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
    period: determinePeriod(new Date().getHours()),
    temperature: '',
    observations: '',
    correctiveActions: ''
  });

  // Déterminer la période en fonction de l'heure
  function determinePeriod(hour) {
    if (hour >= 6 && hour < 14) return 'matin';
    if (hour >= 14 && hour < 22) return 'soir';
    return 'nuit';
  }

  // Mettre à jour la période automatiquement si l'heure change
  useEffect(() => {
    if (formData.measurementTime) {
      const hour = parseInt(formData.measurementTime.split(':')[0]);
      const newPeriod = determinePeriod(hour);
      if (newPeriod !== formData.period) {
        setFormData(prev => ({ ...prev, period: newPeriod }));
      }
    }
  }, [formData.measurementTime]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validation
      if (!formData.refrigeratorId || !formData.temperature) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      const temp = parseFloat(formData.temperature);
      if (isNaN(temp)) {
        throw new Error('La température doit être un nombre valide');
      }

      // Créer le relevé
      await temperatureService.createTemperatureLog({
        ...formData,
        temperature: temp
      });

      setSuccess(true);

      // Réinitialiser le formulaire
      setFormData({
        refrigeratorId: refrigerator?.refrigeratorId || '',
        location: refrigerator?.location || 'Salle de soins - IDE',
        measurementDate: new Date().toISOString().split('T')[0],
        measurementTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        period: determinePeriod(new Date().getHours()),
        temperature: '',
        observations: '',
        correctiveActions: ''
      });

      // Callback de succès
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Déterminer la couleur de l'alerte en fonction de la température
  const getTemperatureAlert = () => {
    if (!formData.temperature) return null;

    const temp = parseFloat(formData.temperature);
    if (isNaN(temp)) return null;

    if (temp < 0 || temp > 10) {
      return { severity: 'error', message: 'Température CRITIQUE - Hors norme HAS' };
    } else if ((temp >= 0 && temp < 2) || (temp > 8 && temp <= 10)) {
      return { severity: 'warning', message: 'Température en ALERTE - Proche de la limite' };
    } else if (temp >= 2 && temp <= 8) {
      return { severity: 'success', message: 'Température CONFORME aux normes HAS (+2°C à +8°C)' };
    }

    return null;
  };

  const tempAlert = getTemperatureAlert();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Nouveau relevé de température
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            {/* Réfrigérateur */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Identifiant du réfrigérateur"
                name="refrigeratorId"
                value={formData.refrigeratorId}
                onChange={handleChange}
                placeholder="Ex: IDE-FRIGO-01"
                disabled={!!refrigerator}
              />
            </Grid>

            {/* Localisation */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Localisation"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ex: Salle de soins - IDE"
              />
            </Grid>

            {/* Date */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                type="date"
                label="Date du relevé"
                name="measurementDate"
                value={formData.measurementDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Heure */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                type="time"
                label="Heure du relevé"
                name="measurementTime"
                value={formData.measurementTime}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Période */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Période</InputLabel>
                <Select
                  name="period"
                  value={formData.period}
                  onChange={handleChange}
                  label="Période"
                >
                  <MenuItem value="matin">Matin (6h-14h)</MenuItem>
                  <MenuItem value="soir">Soir (14h-22h)</MenuItem>
                  <MenuItem value="nuit">Nuit (22h-6h)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Température */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                type="number"
                label="Température (°C)"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                inputProps={{
                  step: 0.1,
                  min: -30,
                  max: 50
                }}
                helperText="Norme HAS : +2°C à +8°C"
              />
            </Grid>

            {/* Alerte température */}
            {tempAlert && (
              <Grid item xs={12}>
                <Alert severity={tempAlert.severity}>
                  {tempAlert.message}
                </Alert>
              </Grid>
            )}

            {/* Observations */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Observations"
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                placeholder="Observations éventuelles..."
              />
            </Grid>

            {/* Actions correctives (si anomalie) */}
            {tempAlert && (tempAlert.severity === 'error' || tempAlert.severity === 'warning') && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Actions correctives"
                  name="correctiveActions"
                  value={formData.correctiveActions}
                  onChange={handleChange}
                  placeholder="Actions mises en place..."
                />
              </Grid>
            )}

            {/* Erreur */}
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {/* Succès */}
            {success && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Relevé de température enregistré avec succès !
                </Alert>
              </Grid>
            )}

            {/* Boutons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {onCancel && (
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={onCancel}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TemperatureLogForm;
