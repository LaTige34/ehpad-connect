import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import residentService from '../../services/residentService';

/**
 * Page de gestion des résidents
 */
const ResidentManagement = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDietType, setFilterDietType] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [stats, setStats] = useState(null);

  // Formulaire de résident
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    roomNumber: '',
    dietType: 'normal',
    chokingRisk: false,
    medicationAdministration: false,
    enhancedHydration: false,
    foodAllergies: false,
    allergyDetails: '',
    medicalNotes: '',
    active: true
  });

  // Charger les résidents
  useEffect(() => {
    loadResidents();
    loadStats();
  }, [page, rowsPerPage, searchQuery, filterDietType]);

  const loadResidents = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
        dietType: filterDietType
      };

      const response = await residentService.getAllResidents(params);

      if (response.success) {
        setResidents(response.data);
        setTotalCount(response.pagination.total);
      }
    } catch (err) {
      setError('Erreur lors du chargement des résidents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await residentService.getResidentStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement statistiques:', err);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (resident = null) => {
    if (resident) {
      setEditingResident(resident);
      setFormData({
        firstName: resident.firstName,
        lastName: resident.lastName,
        roomNumber: resident.roomNumber,
        dietType: resident.dietType,
        chokingRisk: resident.chokingRisk,
        medicationAdministration: resident.medicationAdministration,
        enhancedHydration: resident.enhancedHydration,
        foodAllergies: resident.foodAllergies,
        allergyDetails: resident.allergyDetails || '',
        medicalNotes: resident.medicalNotes || '',
        active: resident.active
      });
    } else {
      setEditingResident(null);
      setFormData({
        firstName: '',
        lastName: '',
        roomNumber: '',
        dietType: 'normal',
        chokingRisk: false,
        medicationAdministration: false,
        enhancedHydration: false,
        foodAllergies: false,
        allergyDetails: '',
        medicalNotes: '',
        active: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingResident(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingResident) {
        await residentService.updateResident(editingResident.id, formData);
        setSuccess('Résident mis à jour avec succès');
      } else {
        await residentService.createResident(formData);
        setSuccess('Résident créé avec succès');
      }
      handleCloseDialog();
      loadResidents();
      loadStats();
    } catch (err) {
      setError('Erreur lors de l\'enregistrement du résident');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce résident ?')) {
      try {
        await residentService.deleteResident(id);
        setSuccess('Résident supprimé avec succès');
        loadResidents();
        loadStats();
      } catch (err) {
        setError('Erreur lors de la suppression du résident');
        console.error(err);
      }
    }
  };

  const getDietTypeLabel = (type) => {
    const labels = {
      normal: 'Normal',
      modified: 'Texture modifiée',
      diabetic: 'Diabétique',
      low_sodium: 'Sans sel'
    };
    return labels[type] || type;
  };

  const getDietTypeColor = (type) => {
    const colors = {
      normal: 'success',
      modified: 'error',
      diabetic: 'warning',
      low_sodium: 'info'
    };
    return colors[type] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Gestion des Résidents
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouveau Résident
        </Button>
      </Box>

      {/* Statistiques */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Résidents
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#FFE0E0' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Texture Modifiée
                </Typography>
                <Typography variant="h4">{stats.byDietType.modified || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#FFF4E0' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Diabétique
                </Typography>
                <Typography variant="h4">{stats.byDietType.diabetic || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#E0F2FF' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avec Précautions
                </Typography>
                <Typography variant="h4">{stats.withPrecautions}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher par nom ou chambre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filtrer par régime</InputLabel>
              <Select
                value={filterDietType}
                onChange={(e) => setFilterDietType(e.target.value)}
                label="Filtrer par régime"
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="modified">Texture modifiée</MenuItem>
                <MenuItem value="diabetic">Diabétique</MenuItem>
                <MenuItem value="low_sodium">Sans sel</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadResidents}
            >
              Actualiser
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau des résidents */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom Complet</TableCell>
              <TableCell>Chambre</TableCell>
              <TableCell>Régime</TableCell>
              <TableCell>Précautions</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : residents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Aucun résident trouvé
                </TableCell>
              </TableRow>
            ) : (
              residents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2 }}>
                        {resident.firstName[0]}{resident.lastName[0]}
                      </Avatar>
                      <Typography>
                        {resident.lastName.toUpperCase()} {resident.firstName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{resident.roomNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={getDietTypeLabel(resident.dietType)}
                      color={getDietTypeColor(resident.dietType)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {resident.chokingRisk && <span title="Risque de fausse route">⚠️</span>}
                      {resident.medicationAdministration && <span title="Administration médicamenteuse">💊</span>}
                      {resident.enhancedHydration && <span title="Hydratation renforcée">🥤</span>}
                      {resident.foodAllergies && <span title="Allergies alimentaires">🚫</span>}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(resident)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(resident.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page"
        />
      </TableContainer>

      {/* Dialog d'édition/création */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingResident ? 'Modifier le résident' : 'Nouveau résident'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prénom"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Numéro de chambre"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Régime alimentaire</InputLabel>
                <Select
                  name="dietType"
                  value={formData.dietType}
                  onChange={handleInputChange}
                  label="Régime alimentaire"
                >
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="modified">Texture modifiée</MenuItem>
                  <MenuItem value="diabetic">Diabétique</MenuItem>
                  <MenuItem value="low_sodium">Sans sel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Précautions médicales
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    name="chokingRisk"
                    checked={formData.chokingRisk}
                    onChange={handleInputChange}
                  />
                }
                label="⚠️ Risque de fausse route"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="medicationAdministration"
                    checked={formData.medicationAdministration}
                    onChange={handleInputChange}
                  />
                }
                label="💊 Administration médicamenteuse spécifique"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="enhancedHydration"
                    checked={formData.enhancedHydration}
                    onChange={handleInputChange}
                  />
                }
                label="🥤 Hydratation renforcée"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="foodAllergies"
                    checked={formData.foodAllergies}
                    onChange={handleInputChange}
                  />
                }
                label="🚫 Allergies alimentaires"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Détails des allergies"
                name="allergyDetails"
                value={formData.allergyDetails}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes médicales"
                name="medicalNotes"
                value={formData.medicalNotes}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                  />
                }
                label="Résident actif"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingResident ? 'Mettre à jour' : 'Créer'}
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

export default ResidentManagement;
