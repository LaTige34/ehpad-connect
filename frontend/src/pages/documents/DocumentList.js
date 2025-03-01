import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Alert,
  Divider,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  Email as EmailIcon
} from '@mui/icons-material';

/**
 * Page de liste des documents
 */
const DocumentList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [documentMenuAnchorEl, setDocumentMenuAnchorEl] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  
  // Données simulées pour le développement
  const [documents, setDocuments] = useState([]);
  
  useEffect(() => {
    // Simuler le chargement des documents
    const loadDocuments = async () => {
      try {
        // Dans une application réelle, ces données seraient chargées depuis l'API
        // const response = await documentService.getUserDocuments();
        
        // Données simulées pour le développement
        setTimeout(() => {
          const mockDocuments = [
            {
              id: 1,
              title: 'Contrat de travail',
              type: 'contract',
              status: 'signed',
              createdAt: '2025-01-10T10:30:00Z',
              signedAt: '2025-01-15T14:22:10Z',
              fileSize: '540 KB',
              fileType: 'application/pdf'
            },
            {
              id: 2,
              title: 'Avenant au contrat',
              type: 'amendment',
              status: 'pending',
              createdAt: '2025-02-28T09:15:00Z',
              fileSize: '320 KB',
              fileType: 'application/pdf'
            },
            {
              id: 3,
              title: 'Fiche de poste',
              type: 'info',
              status: 'read',
              createdAt: '2025-02-05T11:45:00Z',
              fileSize: '210 KB',
              fileType: 'application/pdf'
            },
            {
              id: 4,
              title: 'Planning Mars 2025',
              type: 'planning',
              status: 'pending',
              createdAt: '2025-02-29T16:20:00Z',
              fileSize: '450 KB',
              fileType: 'application/pdf'
            },
            {
              id: 5,
              title: 'Note de service - Horaires d\'été',
              type: 'info',
              status: 'unread',
              createdAt: '2025-02-20T14:10:00Z',
              fileSize: '180 KB',
              fileType: 'application/pdf'
            }
          ];
          
          setDocuments(mockDocuments);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Erreur lors du chargement des documents:', err);
        setError('Impossible de charger les documents. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };
    
    loadDocuments();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  const handleSortClose = () => {
    setSortAnchorEl(null);
  };
  
  const handleDocumentMenuClick = (event, documentId) => {
    setDocumentMenuAnchorEl(event.currentTarget);
    setSelectedDocumentId(documentId);
  };
  
  const handleDocumentMenuClose = () => {
    setDocumentMenuAnchorEl(null);
    setSelectedDocumentId(null);
  };
  
  const handleViewDocument = (documentId) => {
    navigate(`/documents/${documentId}`);
  };
  
  const handleSignDocument = (documentId) => {
    navigate(`/documents/${documentId}/sign`);
  };
  
  const handleEmailDocument = (documentId) => {
    // Dans une application réelle, cette fonction ouvrirait une boîte de dialogue pour envoyer par email
    alert(`Email du document ${documentId} envoyé à mathieu.desobry@ehpadbelleviste.fr`);
  };
  
  const getStatusChip = (status) => {
    switch (status) {
      case 'signed':
        return (
          <Chip 
            icon={<CheckCircleIcon />} 
            label="Signé" 
            color="success" 
            size="small" 
            variant="outlined" 
          />
        );
      case 'pending':
        return (
          <Chip 
            icon={<PendingIcon />} 
            label="À signer" 
            color="warning" 
            size="small" 
            variant="outlined" 
          />
        );
      case 'unread':
        return (
          <Chip 
            icon={<ScheduleIcon />} 
            label="Non lu" 
            color="info" 
            size="small" 
            variant="outlined" 
          />
        );
      case 'read':
        return (
          <Chip 
            icon={<CheckCircleIcon />} 
            label="Lu" 
            color="default" 
            size="small" 
            variant="outlined" 
          />
        );
      default:
        return null;
    }
  };
  
  const getDocumentIcon = (type) => {
    switch (type) {
      case 'contract':
      case 'amendment':
        return <DocIcon color="primary" />;
      case 'planning':
        return <PdfIcon color="secondary" />;
      default:
        return <PdfIcon color="action" />;
    }
  };
  
  // Filtrer les documents en fonction de l'onglet sélectionné
  const getFilteredDocuments = () => {
    let filtered = [...documents];
    
    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filtrer par onglet
    switch (tabValue) {
      case 0: // Tous
        break;
      case 1: // À signer
        filtered = filtered.filter(doc => doc.status === 'pending');
        break;
      case 2: // Signés
        filtered = filtered.filter(doc => doc.status === 'signed');
        break;
      case 3: // Informatifs
        filtered = filtered.filter(doc => doc.type === 'info');
        break;
      default:
        break;
    }
    
    return filtered;
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Documents
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Barre de recherche et filtres */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button 
              fullWidth 
              variant="outlined" 
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
              <MenuItem onClick={handleFilterClose}>Tous les types</MenuItem>
              <MenuItem onClick={handleFilterClose}>Contrats</MenuItem>
              <MenuItem onClick={handleFilterClose}>Avenants</MenuItem>
              <MenuItem onClick={handleFilterClose}>Plannings</MenuItem>
              <MenuItem onClick={handleFilterClose}>Informatifs</MenuItem>
            </Menu>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={sortAnchorEl ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />} 
              onClick={handleSortClick}
              disabled={loading}
            >
              Trier
            </Button>
            <Menu
              anchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={handleSortClose}
            >
              <MenuItem onClick={handleSortClose}>Date (récent d'abord)</MenuItem>
              <MenuItem onClick={handleSortClose}>Date (ancien d'abord)</MenuItem>
              <MenuItem onClick={handleSortClose}>Nom (A-Z)</MenuItem>
              <MenuItem onClick={handleSortClose}>Nom (Z-A)</MenuItem>
              <MenuItem onClick={handleSortClose}>Statut</MenuItem>
            </Menu>
          </Grid>
        </Grid>
        
        {/* Onglets de filtrage */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="filtres de documents">
            <Tab label="Tous" id="tab-0" />
            <Tab 
              label="À signer" 
              id="tab-1" 
              icon={documents.filter(d => d.status === 'pending').length > 0 ? 
                <Chip 
                  label={documents.filter(d => d.status === 'pending').length} 
                  size="small" 
                  color="warning" 
                /> : null
              } 
              iconPosition="end"
            />
            <Tab label="Signés" id="tab-2" />
            <Tab label="Informatifs" id="tab-3" />
          </Tabs>
        </Box>
        
        {/* Liste des documents */}
        {loading ? (
          <Box>
            {Array(3).fill().map((_, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={30} />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="30%" />
                </CardContent>
                <CardActions>
                  <Skeleton variant="rectangular" width={80} height={30} sx={{ mr: 1 }} />
                  <Skeleton variant="rectangular" width={80} height={30} />
                </CardActions>
              </Card>
            ))}
          </Box>
        ) : (
          <Box>
            {getFilteredDocuments().length > 0 ? (
              <List>
                {getFilteredDocuments().map((document) => (
                  <React.Fragment key={document.id}>
                    <ListItem 
                      alignItems="flex-start" 
                      sx={{ 
                        py: 2,
                        backgroundColor: document.status === 'unread' ? 'rgba(3, 169, 244, 0.05)' : 'transparent'
                      }}
                    >
                      <Box sx={{ pr: 2 }}>
                        {getDocumentIcon(document.type)}
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="h6" component="div">
                            {document.title}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" component="span">
                              Ajouté le {formatDate(document.createdAt)} • {document.fileSize}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {getStatusChip(document.status)}
                              <Chip 
                                label={document.type === 'contract' ? 'Contrat' : 
                                      document.type === 'amendment' ? 'Avenant' : 
                                      document.type === 'planning' ? 'Planning' : 'Informatif'} 
                                size="small" 
                                sx={{ ml: 1 }} 
                              />
                            </Box>
                            <Box sx={{ mt: 2 }}>
                              <Button 
                                variant="outlined" 
                                size="small" 
                                onClick={() => handleViewDocument(document.id)}
                                sx={{ mr: 1 }}
                              >
                                Consulter
                              </Button>
                              
                              {document.status === 'pending' && (
                                <Button 
                                  variant="contained" 
                                  size="small" 
                                  color="primary" 
                                  onClick={() => handleSignDocument(document.id)}
                                  sx={{ mr: 1 }}
                                >
                                  Signer
                                </Button>
                              )}
                              
                              <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<EmailIcon />}
                                onClick={() => handleEmailDocument(document.id)}
                              >
                                Envoyer
                              </Button>
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="options"
                          onClick={(e) => handleDocumentMenuClick(e, document.id)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
                Aucun document trouvé.
              </Typography>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Menu contextuel pour les documents */}
      <Menu
        anchorEl={documentMenuAnchorEl}
        open={Boolean(documentMenuAnchorEl)}
        onClose={handleDocumentMenuClose}
      >
        <MenuItem 
          onClick={() => {
            handleViewDocument(selectedDocumentId);
            handleDocumentMenuClose();
          }}
        >
          Consulter
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleEmailDocument(selectedDocumentId);
            handleDocumentMenuClose();
          }}
        >
          Envoyer par email
        </MenuItem>
        <MenuItem 
          onClick={() => {
            alert(`Téléchargement du document ${selectedDocumentId}`);
            handleDocumentMenuClose();
          }}
        >
          Télécharger
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DocumentList;
