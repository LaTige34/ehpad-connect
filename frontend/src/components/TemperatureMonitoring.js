import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  CheckCircle as ValidateIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import temperatureService from '../services/temperatureService';

/**
 * Composant de visualisation et monitoring des températures
 */
const TemperatureMonitoring = ({ refrigeratorId, year, month }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [validateDialog, setValidateDialog] = useState(false);
  const [correctiveActions, setCorrectiveActions] = useState('');

  // Charger les données
  useEffect(() => {
    if (refrigeratorId && year && month) {
      loadData();
    }
  }, [refrigeratorId, year, month]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await temperatureService.getMonthlyStats(refrigeratorId, year, month);
      setStats(response.data.stats);
      setLogs(response.data.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await temperatureService.downloadMonthlyPDF(refrigeratorId, year, month);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleValidate = async () => {
    try {
      await temperatureService.validateTemperatureLog(selectedLog.id, correctiveActions);
      setValidateDialog(false);
      setSelectedLog(null);
      setCorrectiveActions('');
      loadData(); // Recharger les données
    } catch (err) {
      setError(err.message);
    }
  };

  const getAlertIcon = (alertLevel) => {
    switch (alertLevel) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  const getAlertChip = (log) => {
    if (log.isWithinRange) {
      return <Chip label="Conforme" color="success" size="small" />;
    } else if (log.alertLevel === 'critical') {
      return <Chip label="Critique" color="error" size="small" />;
    } else {
      return <Chip label="Alerte" color="warning" size="small" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stats) {
    return <Alert severity="info">Aucune donnée disponible</Alert>;
  }

  return (
    <Box>
      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Relevés effectués
              </Typography>
              <Typography variant="h4">{stats.totalLogs}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Température moyenne
              </Typography>
              <Typography variant="h4">{stats.avgTemperature}°C</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Min / Max
              </Typography>
              <Typography variant="h5">
                {stats.minTemperature}°C / {stats.maxTemperature}°C
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Taux de conformité
              </Typography>
              <Typography
                variant="h4"
                color={stats.conformityRate >= 95 ? 'success.main' : 'warning.main'}
              >
                {stats.conformityRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertes */}
      {(stats.criticalLogs > 0 || stats.warningLogs > 0) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Anomalies détectées : {stats.criticalLogs} critique(s), {stats.warningLogs} avertissement(s)
        </Alert>
      )}

      {/* Actions */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadPDF}
        >
          Télécharger la fiche PDF
        </Button>
      </Box>

      {/* Tableau des relevés */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Relevés de température
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Heure</TableCell>
                  <TableCell>Période</TableCell>
                  <TableCell>Température</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        Aucun relevé pour cette période
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow
                      key={log.id}
                      sx={{
                        backgroundColor: log.alertLevel === 'critical' ? '#ffebee' :
                                        log.alertLevel === 'warning' ? '#fff3e0' : 'inherit'
                      }}
                    >
                      <TableCell>
                        {new Date(log.measurementDate).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>{log.measurementTime.substring(0, 5)}</TableCell>
                      <TableCell>
                        {log.period.charAt(0).toUpperCase() + log.period.slice(1)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getAlertIcon(log.alertLevel)}
                          <Typography
                            variant="body2"
                            fontWeight={log.isWithinRange ? 'normal' : 'bold'}
                            color={log.isWithinRange ? 'inherit' : 'error'}
                          >
                            {log.temperature}°C
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{getAlertChip(log)}</TableCell>
                      <TableCell>
                        {log.recordedBy ? log.recordedBy.name : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setSelectedLog(log)}
                          title="Voir détails"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {!log.isWithinRange && !log.validatedById && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedLog(log);
                              setCorrectiveActions(log.correctiveActions || '');
                              setValidateDialog(true);
                            }}
                            title="Valider"
                          >
                            <ValidateIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog Détails */}
      <Dialog
        open={!!selectedLog && !validateDialog}
        onClose={() => setSelectedLog(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedLog && (
          <>
            <DialogTitle>Détails du relevé</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 1 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Date :</strong> {new Date(selectedLog.measurementDate).toLocaleDateString('fr-FR')}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Heure :</strong> {selectedLog.measurementTime}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Période :</strong> {selectedLog.period}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Température :</strong> {selectedLog.temperature}°C
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Conformité :</strong> {selectedLog.isWithinRange ? 'Conforme' : 'Non conforme'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Agent :</strong> {selectedLog.recordedBy?.name}
                </Typography>
                {selectedLog.observations && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Observations :</strong> {selectedLog.observations}
                  </Typography>
                )}
                {selectedLog.correctiveActions && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Actions correctives :</strong> {selectedLog.correctiveActions}
                  </Typography>
                )}
                {selectedLog.validatedBy && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Validé par :</strong> {selectedLog.validatedBy.name}
                    ({new Date(selectedLog.validatedAt).toLocaleDateString('fr-FR')})
                  </Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedLog(null)}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog Validation */}
      <Dialog open={validateDialog} onClose={() => setValidateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Valider le relevé</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Actions correctives"
            value={correctiveActions}
            onChange={(e) => setCorrectiveActions(e.target.value)}
            placeholder="Décrire les actions correctives mises en place..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setValidateDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleValidate}>
            Valider
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemperatureMonitoring;
