import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Send as SendIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

/**
 * Page de détails d'un document
 */
const DocumentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulation de chargement de document
    // Dans une vraie application, ceci ferait un appel API
    setTimeout(() => {
      setDocument({
        id: id,
        title: `Document ${id}`,
        type: 'Contrat de séjour',
        status: 'En attente de signature',
        createdAt: new Date().toLocaleDateString('fr-FR'),
        description: 'Document important nécessitant votre signature.',
        content: 'Contenu du document...'
      });
      setLoading(false);
    }, 500);
  }, [id]);

  const handleSign = () => {
    navigate(`/documents/${id}/sign`);
  };

  const handleDownload = () => {
    // Logique de téléchargement
    console.log('Téléchargement du document', id);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Chargement...</Typography>
      </Container>
    );
  }

  if (!document) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Document non trouvé</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/documents')}
        sx={{ mb: 3 }}
      >
        Retour aux documents
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {document.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Chip label={document.type} color="primary" />
                  <Chip label={document.status} color="warning" />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Télécharger
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSign}
                >
                  Signer
                </Button>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Date de création
            </Typography>
            <Typography variant="body1">
              {document.createdAt}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Type de document
            </Typography>
            <Typography variant="body1">
              {document.type}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {document.description}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Contenu du document
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: '#f9f9f9',
                minHeight: '300px'
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {document.content}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default DocumentDetails;
