import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  Avatar
} from '@mui/material';
import {
  Save as SaveIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  TableRestaurant as TableIcon,
  Check as CheckIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import residentService from '../../services/residentService';
import diningTableService from '../../services/diningTableService';
import seatingPlanService from '../../services/seatingPlanService';

/**
 * Éditeur de plan de table
 */
const SeatingPlanEditor = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [residents, setResidents] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Données du plan de table
  const [planData, setPlanData] = useState({
    name: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    status: 'draft',
    seatingArrangement: [], // [{tableId, residentId, position}]
    guests: [], // [{name, tableId, position, notes}]
    temporaryInstructions: ''
  });

  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedResident, setSelectedResident] = useState('');
  const [openGuestDialog, setOpenGuestDialog] = useState(false);
  const [guestData, setGuestData] = useState({ name: '', notes: '' });

  const steps = ['Informations', 'Configuration des tables', 'Assignation des résidents', 'Révision'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [residentsRes, tablesRes] = await Promise.all([
        residentService.getAllResidents({ limit: 100, active: true }),
        diningTableService.getAllTables({ active: true })
      ]);

      if (residentsRes.success) {
        setResidents(residentsRes.data);
      }
      if (tablesRes.success) {
        setTables(tablesRes.data);
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePlanDataChange = (field, value) => {
    setPlanData({
      ...planData,
      [field]: value
    });
  };

  const handleOpenAssignDialog = (table) => {
    setSelectedTable(table);
    setSelectedResident('');
    setOpenAssignDialog(true);
  };

  const handleAssignResident = () => {
    if (!selectedResident || !selectedTable) return;

    const newArrangement = [
      ...planData.seatingArrangement,
      {
        tableId: selectedTable.id,
        residentId: selectedResident,
        position: planData.seatingArrangement.filter(s => s.tableId === selectedTable.id).length + 1
      }
    ];

    setPlanData({
      ...planData,
      seatingArrangement: newArrangement
    });

    setOpenAssignDialog(false);
    setSelectedResident('');
  };

  const handleRemoveResident = (residentId, tableId) => {
    setPlanData({
      ...planData,
      seatingArrangement: planData.seatingArrangement.filter(
        s => !(s.residentId === residentId && s.tableId === tableId)
      )
    });
  };

  const handleOpenGuestDialog = (table) => {
    setSelectedTable(table);
    setGuestData({ name: '', notes: '' });
    setOpenGuestDialog(true);
  };

  const handleAddGuest = () => {
    if (!guestData.name || !selectedTable) return;

    const newGuests = [
      ...planData.guests,
      {
        ...guestData,
        tableId: selectedTable.id,
        position: planData.guests.filter(g => g.tableId === selectedTable.id).length + 1
      }
    ];

    setPlanData({
      ...planData,
      guests: newGuests
    });

    setOpenGuestDialog(false);
    setGuestData({ name: '', notes: '' });
  };

  const handleRemoveGuest = (guestIndex) => {
    setPlanData({
      ...planData,
      guests: planData.guests.filter((_, index) => index !== guestIndex)
    });
  };

  const handleSavePlan = async () => {
    try {
      const response = await seatingPlanService.createSeatingPlan(planData);
      if (response.success) {
        setSuccess('Plan de table créé avec succès');
        // Reset form after save
        setTimeout(() => {
          window.location.href = '/seating-plans';
        }, 2000);
      }
    } catch (err) {
      setError('Erreur lors de la sauvegarde du plan de table');
      console.error(err);
    }
  };

  const getResidentById = (id) => {
    return residents.find(r => r.id === id);
  };

  const getTableResidents = (tableId) => {
    return planData.seatingArrangement
      .filter(s => s.tableId === tableId)
      .map(s => getResidentById(s.residentId))
      .filter(r => r !== undefined);
  };

  const getTableGuests = (tableId) => {
    return planData.guests.filter(g => g.tableId === tableId);
  };

  const getUnassignedResidents = () => {
    const assignedIds = planData.seatingArrangement.map(s => s.residentId);
    return residents.filter(r => !assignedIds.includes(r.id));
  };

  const getDietTypeColor = (type) => {
    const colors = {
      normal: '#C8E6C9',
      modified: '#FF6B6B',
      diabetic: '#FFA726',
      low_sodium: '#64B5F6'
    };
    return colors[type] || '#C8E6C9';
  };

  // Rendu du contenu selon l'étape
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nom du plan de table"
                  value={planData.name}
                  onChange={(e) => handlePlanDataChange('name', e.target.value)}
                  required
                  placeholder="Ex: Plan de table - Janvier 2025"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={planData.description}
                  onChange={(e) => handlePlanDataChange('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date d'application"
                  value={planData.effectiveDate}
                  onChange={(e) => handlePlanDataChange('effectiveDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Consignes temporaires"
                  value={planData.temporaryInstructions}
                  onChange={(e) => handlePlanDataChange('temporaryInstructions', e.target.value)}
                  placeholder="Ex: Attention aux nouveaux résidents..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tables disponibles ({tables.length})
            </Typography>
            <Grid container spacing={2}>
              {tables.map((table) => (
                <Grid item xs={12} sm={6} md={4} key={table.id}>
                  <Card variant="outlined">
                    <CardHeader
                      avatar={<TableIcon />}
                      title={`Table ${table.tableNumber}`}
                      subheader={`Capacité: ${table.capacity} places`}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
            {tables.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Aucune table disponible. Veuillez créer des tables avant de continuer.
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {/* Liste des résidents non assignés */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    Résidents non assignés ({getUnassignedResidents().length})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <List>
                    {getUnassignedResidents().map((resident) => (
                      <ListItem
                        key={resident.id}
                        sx={{
                          mb: 1,
                          border: '1px solid #ddd',
                          borderRadius: 1,
                          bgcolor: getDietTypeColor(resident.dietType)
                        }}
                      >
                        <Avatar sx={{ mr: 2 }}>
                          {resident.firstName[0]}{resident.lastName[0]}
                        </Avatar>
                        <ListItemText
                          primary={`${resident.lastName.toUpperCase()} ${resident.firstName}`}
                          secondary={`Ch. ${resident.roomNumber}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* Tables avec assignations */}
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Assignation aux tables
                </Typography>
                <Grid container spacing={2}>
                  {tables.map((table) => {
                    const tableResidents = getTableResidents(table.id);
                    const tableGuests = getTableGuests(table.id);
                    const totalSeated = tableResidents.length + tableGuests.length;

                    return (
                      <Grid item xs={12} md={6} key={table.id}>
                        <Card>
                          <CardHeader
                            title={`Table ${table.tableNumber}`}
                            subheader={`${totalSeated} / ${table.capacity} places`}
                            action={
                              <Box>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenAssignDialog(table)}
                                  disabled={totalSeated >= table.capacity}
                                >
                                  <PersonAddIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenGuestDialog(table)}
                                  disabled={totalSeated >= table.capacity}
                                >
                                  <AddIcon />
                                </IconButton>
                              </Box>
                            }
                          />
                          <CardContent>
                            {/* Résidents */}
                            <List dense>
                              {tableResidents.map((resident) => (
                                <ListItem
                                  key={resident.id}
                                  sx={{
                                    mb: 0.5,
                                    bgcolor: getDietTypeColor(resident.dietType),
                                    borderRadius: 1
                                  }}
                                  secondaryAction={
                                    <IconButton
                                      edge="end"
                                      size="small"
                                      onClick={() => handleRemoveResident(resident.id, table.id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  }
                                >
                                  <ListItemText
                                    primary={
                                      <Typography variant="body2">
                                        {resident.lastName.toUpperCase()} {resident.firstName}
                                      </Typography>
                                    }
                                    secondary={`Ch. ${resident.roomNumber}`}
                                  />
                                </ListItem>
                              ))}
                              {/* Invités */}
                              {tableGuests.map((guest, index) => (
                                <ListItem
                                  key={`guest-${index}`}
                                  sx={{
                                    mb: 0.5,
                                    bgcolor: '#FFF9C4',
                                    borderRadius: 1
                                  }}
                                  secondaryAction={
                                    <IconButton
                                      edge="end"
                                      size="small"
                                      onClick={() => handleRemoveGuest(
                                        planData.guests.findIndex(
                                          g => g.tableId === table.id && g.name === guest.name
                                        )
                                      )}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  }
                                >
                                  <ListItemText
                                    primary={
                                      <Typography variant="body2">
                                        👤 {guest.name} (Invité)
                                      </Typography>
                                    }
                                    secondary={guest.notes}
                                  />
                                </ListItem>
                              ))}
                              {totalSeated === 0 && (
                                <Typography variant="body2" color="textSecondary">
                                  Table vide
                                </Typography>
                              )}
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Révision du plan de table
            </Typography>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1"><strong>Nom:</strong> {planData.name}</Typography>
              <Typography variant="body2"><strong>Date d'application:</strong> {planData.effectiveDate}</Typography>
              <Typography variant="body2"><strong>Description:</strong> {planData.description || 'Aucune'}</Typography>
              {planData.temporaryInstructions && (
                <Typography variant="body2"><strong>Consignes:</strong> {planData.temporaryInstructions}</Typography>
              )}
            </Paper>

            <Typography variant="h6" gutterBottom>
              Statistiques
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary">Résidents assignés</Typography>
                    <Typography variant="h4">{planData.seatingArrangement.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary">Invités</Typography>
                    <Typography variant="h4">{planData.guests.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary">Résidents non assignés</Typography>
                    <Typography variant="h4">{getUnassignedResidents().length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {getUnassignedResidents().length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Il reste {getUnassignedResidents().length} résident(s) non assigné(s) à une table.
              </Alert>
            )}

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Aperçu des tables
            </Typography>
            <Grid container spacing={2}>
              {tables.map((table) => {
                const tableResidents = getTableResidents(table.id);
                const tableGuests = getTableGuests(table.id);

                return (
                  <Grid item xs={12} sm={6} md={4} key={table.id}>
                    <Card>
                      <CardHeader
                        title={`Table ${table.tableNumber}`}
                        subheader={`${tableResidents.length + tableGuests.length} / ${table.capacity}`}
                      />
                      <CardContent>
                        <List dense>
                          {tableResidents.map((resident) => (
                            <ListItem key={resident.id}>
                              <Chip
                                label={`${resident.lastName.toUpperCase()} ${resident.firstName}`}
                                size="small"
                                sx={{ bgcolor: getDietTypeColor(resident.dietType) }}
                              />
                            </ListItem>
                          ))}
                          {tableGuests.map((guest, index) => (
                            <ListItem key={`guest-${index}`}>
                              <Chip
                                label={`👤 ${guest.name}`}
                                size="small"
                                color="warning"
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Créer un plan de table
        </Typography>
        <Typography variant="body2" color="textSecondary">
          EHPAD Belle Viste - 70 lits
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Contenu */}
      <Paper>{renderStepContent()}</Paper>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Précédent
        </Button>
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSavePlan}
            >
              Enregistrer le plan
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Suivant
            </Button>
          )}
        </Box>
      </Box>

      {/* Dialog d'assignation de résident */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)}>
        <DialogTitle>
          Assigner un résident à la table {selectedTable?.tableNumber}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Sélectionner un résident</InputLabel>
            <Select
              value={selectedResident}
              onChange={(e) => setSelectedResident(e.target.value)}
              label="Sélectionner un résident"
            >
              {getUnassignedResidents().map((resident) => (
                <MenuItem key={resident.id} value={resident.id}>
                  {resident.lastName.toUpperCase()} {resident.firstName} - Ch. {resident.roomNumber}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Annuler</Button>
          <Button onClick={handleAssignResident} variant="contained">
            Assigner
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'ajout d'invité */}
      <Dialog open={openGuestDialog} onClose={() => setOpenGuestDialog(false)}>
        <DialogTitle>
          Ajouter un invité à la table {selectedTable?.tableNumber}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nom de l'invité"
            value={guestData.name}
            onChange={(e) => setGuestData({ ...guestData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Notes"
            value={guestData.notes}
            onChange={(e) => setGuestData({ ...guestData, notes: e.target.value })}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGuestDialog(false)}>Annuler</Button>
          <Button onClick={handleAddGuest} variant="contained">
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SeatingPlanEditor;
