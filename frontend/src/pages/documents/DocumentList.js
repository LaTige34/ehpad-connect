import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  Paper, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  ListItemSecondaryAction, 
  Chip, 
  IconButton, 
  Button, 
  Divider, 
  TextField, 
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { 
  Description, 
  DescriptionOutlined, 
  Search, 
  FilterList, 
  ArrowDownward, 
  ArrowUpward, 
  MoreVert, 
  Download, 
  Email, 
  OpenInNew 
} from '@mui/icons-material';

/**
 * Page listant les documents
 */
const DocumentList = () => {
  const navigate = useNavigate();
  
  // État pour les filtres et le tri
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  
  // Menu des actions
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  
  // Données simulées de documents
  const [documents, setDocuments] = useState([]);
  
  // Simuler le chargement des données
  useEffect(() => {
    setIsLoading(true);
    
    // Simuler un appel API
    setTimeout(() => {
      const mockDocuments = [
        {
          id: 1,
          title: 'Contrat de travail',
          date: '15/01/2025',
          status: 'signed',
          type: 'contract'
        },
        {
          id: 2,
          title: 'Avenant au contrat',
          date: '28/02/2025',
          status: 'pending',
          type: 'amendment'
        },
        {
          id: 3,
          title: 'Fiche de poste',
          date: '05/02/2025',
          status: 'read',
          type: 'info'
        },
        {
          id: 4,
          title: 'Planning Février 2025',
          date: '01/02/2025',
          status: 'signed',
          type: 'planning'
        },
        {
          id: 5,
          title: 'Planning Mars 2025',
          date: '01/03/2025',
          status: 'pending',
          type: 'planning'
        }
      ];
      
      setDocuments(mockDocuments);
      setIsLoading(false);
    }, 800);
  }, []);
  
  // Changement de filtre
  const handleFilterChange = (event, newValue) => {
    setFilter(newValue);
  };
  
  // Changement de recherche
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Changer la direction de tri
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };
  
  // Ouvrir le menu des actions
  const handleMenuOpen = (event, documentId) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedDocumentId(documentId);
  };
  
  // Fermer le menu des actions
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedDocumentId(null);
  };
  
  // Télécharger un document
  const handleDownload = (documentId) => {
    alert(`Téléchargement du document ${documentId} (simulation)`);
    handleMenuClose();
  };
  
  // Envoyer un document par email
  const handleSendByEmail = (documentId) => {
    alert(`Envoi du document ${documentId} par email à mathieu.desobry@ehpadbelleviste.fr (simulation)`);
    handleMenuClose();
  };
  
  // Consulter un document
  const handleViewDocument = (documentId) => {
    navigate(`/documents/${documentId}`);
  };
  
  // Signer un document
  const handleSignDocument = (documentId) => {
    navigate(`/documents/${documentId}/sign`);
  };
  
  // Filtrer les documents selon les critères
  const filteredDocuments = documents.filter(doc => {
    // Filtrer par type
    if (filter !== 'all' && doc.type !== filter) {
      return false;
    }
    
    // Filtrer par terme de recherche
    if (searchTerm && !doc.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Trier les documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    
    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
  });
  
  // Obtenir la puce de statut
  const getStatusChip = (status) => {
    switch (status) {
      case 'signed':
        return <Chip label="Signé" color="success" size="small" />;
      case 'pending':
        return <Chip label="À signer" color="warning" size="small" />;
      case 'read':
        return <Chip label="Information" color="default" size="small" />;
      default:
        return <Chip label="Autre" size="small" />;
    }
  };
  
  // Obtenir l'icône selon le type de document
  const getDocumentIcon = (type) => {
    switch (type) {
      case 'contract':
      case 'amendment':
        return <Description color="primary" />;
      default:
        return <DescriptionOutlined />;
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Mes Documents
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={filter}
          onChange={handleFilterChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Tous" value="all" />
          <Tab label="Contrats" value="contract" />
          <Tab label="Avenants" value="amendment" />
          <Tab label="Plannings" value="planning" />
          <Tab label="Informations" value="info" />
        </Tabs>
      </Paper>
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <TextField
          placeholder="Rechercher un document..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1, mr: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        
        <Button
          startIcon={sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
          onClick={toggleSortDirection}
          variant="outlined"
        >
          Date
        </Button>
      </Box>
      
      <Paper>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <CircularProgress />
          </Box>
        ) : sortedDocuments.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography variant="body1" color="text.secondary">
              Aucun document trouvé
            </Typography>
          </Box>
        ) : (
          <List>
            {sortedDocuments.map((document, index) => (
              <React.Fragment key={document.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem 
                  button 
                  onClick={() => handleViewDocument(document.id)}
                >
                  <ListItemIcon>
                    {getDocumentIcon(document.type)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={document.title} 
                    secondary={`Ajouté le ${document.date}`} 
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" alignItems="center">
                      {getStatusChip(document.status)}
                      
                      {document.status === 'pending' && (
                        <Button 
                          color="primary" 
                          size="small" 
                          sx={{ ml: 2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSignDocument(document.id);
                          }}
                        >
                          Signer
                        </Button>
                      )}
                      
                      <IconButton
                        edge="end"
                        aria-label="more"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, document.id);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewDocument(selectedDocumentId)}>
          <ListItemIcon>
            <OpenInNew fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Voir le document" />
        </MenuItem>
        <MenuItem onClick={() => handleDownload(selectedDocumentId)}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Télécharger" />
        </MenuItem>
        <MenuItem onClick={() => handleSendByEmail(selectedDocumentId)}>
          <ListItemIcon>
            <Email fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Envoyer par email" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DocumentList;
