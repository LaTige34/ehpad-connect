import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Archive as ArchiveIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import seatingPlanService from '../../services/seatingPlanService';

/**
 * Liste des plans de table
 */
const SeatingPlanList = () => {
  const navigate = useNavigate();
  const [seatingPlans, setSeatingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [activePlan, setActivePlan] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [duplicateData, setDuplicateData] = useState({
    name: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadSeatingPlans();
    loadActivePlan();
  }, [page, rowsPerPage, statusFilter]);

  const loadSeatingPlans = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter
      };

      const response = await seatingPlanService.getAllSeatingPlans(params);

      if (response.success) {
        setSeatingPlans(response.data);
        setTotalCount(response.pagination.total);
      }
    } catch (err) {
      setError('Erreur lors du chargement des plans de table');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadActivePlan = async () => {
    try {
      const response = await seatingPlanService.getActiveSeatingPlan();
      if (response.success) {
        setActivePlan(response.data);
      }
    } catch (err) {
      // Pas de plan actif, ce n'est pas une erreur
      console.log('Aucun plan actif');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, plan) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlan(plan);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownloadPDF = async (planId) => {
    try {
      await seatingPlanService.downloadPDF(planId);
      setSuccess('PDF téléchargé avec succès');
    } catch (err) {
      setError('Erreur lors du téléchargement du PDF');
      console.error(err);
    }
    handleMenuClose();
  };

  const handleActivate = async (planId) => {
    try {
      await seatingPlanService.activateSeatingPlan(planId);
      setSuccess('Plan de table activé avec succès');
      loadSeatingPlans();
      loadActivePlan();
    } catch (err) {
      setError('Erreur lors de l\'activation du plan de table');
      console.error(err);
    }
    handleMenuClose();
  };

  const handleArchive = async (planId) => {
    try {
      await seatingPlanService.archiveSeatingPlan(planId);
      setSuccess('Plan de table archivé avec succès');
      loadSeatingPlans();
      loadActivePlan();
    } catch (err) {
      setError('Erreur lors de l\'archivage du plan de table');
      console.error(err);
    }
    handleMenuClose();
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce plan de table ?')) {
      try {
        await seatingPlanService.deleteSeatingPlan(planId);
        setSuccess('Plan de table supprimé avec succès');
        loadSeatingPlans();
      } catch (err) {
        setError('Erreur lors de la suppression du plan de table');
        console.error(err);
      }
    }
    handleMenuClose();
  };

  const handleOpenDuplicateDialog = (plan) => {
    setSelectedPlan(plan);
    setDuplicateData({
      name: `${plan.name} (copie)`,
      effectiveDate: new Date().toISOString().split('T')[0]
    });
    setOpenDuplicateDialog(true);
    handleMenuClose();
  };

  const handleDuplicate = async () => {
    try {
      await seatingPlanService.duplicateSeatingPlan(selectedPlan.id, duplicateData);
      setSuccess('Plan de table dupliqué avec succès');
      setOpenDuplicateDialog(false);
      loadSeatingPlans();
    } catch (err) {
      setError('Erreur lors de la duplication du plan de table');
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      active: 'success',
      archived: 'warning'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Brouillon',
      active: 'Actif',
      archived: 'Archivé'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1">
            Plans de table
          </Typography>
          <Typography variant="body2" color="textSecondary">
            EHPAD Belle Viste - Salle de restauration
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/seating/plan/new')}
        >
          Nouveau Plan
        </Button>
      </Box>

      {/* Plan actif */}
      {activePlan && (
        <Card sx={{ mb: 3, bgcolor: '#E8F5E9' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="h6">Plan actif</Typography>
            </Box>
            <Typography variant="body1">
              <strong>{activePlan.name}</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Date d'application: {formatDate(activePlan.effectiveDate)}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadPDF(activePlan.id)}
              >
                Télécharger PDF
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filtrer par statut</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Filtrer par statut"
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="draft">Brouillon</MenuItem>
                <MenuItem value="active">Actif</MenuItem>
                <MenuItem value="archived">Archivé</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau des plans */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Date d'application</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Résidents</TableCell>
              <TableCell>Créé le</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : seatingPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Aucun plan de table trouvé
                </TableCell>
              </TableRow>
            ) : (
              seatingPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {plan.name}
                    </Typography>
                    {plan.description && (
                      <Typography variant="caption" color="textSecondary">
                        {plan.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(plan.effectiveDate)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(plan.status)}
                      color={getStatusColor(plan.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {plan.seatingArrangement?.length || 0} résidents
                    {plan.guests?.length > 0 && ` + ${plan.guests.length} invités`}
                  </TableCell>
                  <TableCell>
                    {new Date(plan.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, plan)}
                    >
                      <MoreIcon />
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

      {/* Menu contextuel */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDownloadPDF(selectedPlan?.id)}>
          <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
          Télécharger PDF
        </MenuItem>
        {selectedPlan?.status !== 'active' && (
          <MenuItem onClick={() => handleActivate(selectedPlan?.id)}>
            <CheckCircleIcon sx={{ mr: 1 }} fontSize="small" />
            Activer
          </MenuItem>
        )}
        {selectedPlan?.status === 'active' && (
          <MenuItem onClick={() => handleArchive(selectedPlan?.id)}>
            <ArchiveIcon sx={{ mr: 1 }} fontSize="small" />
            Archiver
          </MenuItem>
        )}
        <MenuItem onClick={() => handleOpenDuplicateDialog(selectedPlan)}>
          <CopyIcon sx={{ mr: 1 }} fontSize="small" />
          Dupliquer
        </MenuItem>
        {selectedPlan?.status !== 'active' && (
          <MenuItem onClick={() => handleDelete(selectedPlan?.id)}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Supprimer
          </MenuItem>
        )}
      </Menu>

      {/* Dialog de duplication */}
      <Dialog open={openDuplicateDialog} onClose={() => setOpenDuplicateDialog(false)}>
        <DialogTitle>Dupliquer le plan de table</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nom du nouveau plan"
            value={duplicateData.name}
            onChange={(e) => setDuplicateData({ ...duplicateData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            type="date"
            label="Date d'application"
            value={duplicateData.effectiveDate}
            onChange={(e) => setDuplicateData({ ...duplicateData, effectiveDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDuplicateDialog(false)}>Annuler</Button>
          <Button onClick={handleDuplicate} variant="contained">
            Dupliquer
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

export default SeatingPlanList;
