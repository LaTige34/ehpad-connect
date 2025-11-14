import React, { useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Stack,
  Divider
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SeatingPlanTable from '../../components/seating/SeatingPlanTable';

/**
 * Page principale pour afficher et gérer le plan de table de la salle de restauration
 */
const SeatingPlanPage = () => {
  const printRef = useRef();

  /**
   * Fonction pour imprimer le plan de table
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * Fonction pour télécharger le plan de table en SVG
   */
  const handleDownloadSVG = () => {
    const svgElement = printRef.current.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = 'plan_salle_restauration_belle_vista.svg';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    }
  };

  /**
   * Fonction pour télécharger le plan de table en PNG
   */
  const handleDownloadPNG = () => {
    const svgElement = printRef.current.querySelector('svg');
    if (svgElement) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();

      // Augmenter la résolution pour une meilleure qualité
      const scale = 2;
      canvas.width = 1400 * scale;
      canvas.height = 1000 * scale;
      ctx.scale(scale, scale);

      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = 'plan_salle_restauration_belle_vista.png';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(url);
        });
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* En-tête avec actions */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <RestaurantIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
                Plan de la Salle de Restauration
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                EHPAD Belle Vista - Tisanerie
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadSVG}
              sx={{ textTransform: 'none' }}
            >
              Télécharger SVG
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPNG}
              sx={{ textTransform: 'none' }}
            >
              Télécharger PNG
            </Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ textTransform: 'none' }}
            >
              Imprimer
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Format
            </Typography>
            <Typography variant="body1" fontWeight="500">
              A3 Paysage
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Services
            </Typography>
            <Typography variant="body1" fontWeight="500">
              2 services (Beige et Rose)
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Zones
            </Typography>
            <Typography variant="body1" fontWeight="500">
              Porte Cuisine, Centre, Porte Plonge
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Informations de sécurité */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: '#FFF9E6', borderLeft: '4px solid #FFA726' }}>
        <Typography variant="subtitle2" fontWeight="600" color="#E65100" gutterBottom>
          ⚠️ Consignes de sécurité
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Identification claire et rapide des résidents<br />
          • Prévention des erreurs médicamenteuses<br />
          • Lecture facile pour IDE en service<br />
          • Zones blanches pour écriture manuscrite des noms
        </Typography>
      </Paper>

      {/* Plan de table */}
      <Paper
        elevation={3}
        ref={printRef}
        sx={{
          p: 2,
          bgcolor: 'white',
          '@media print': {
            boxShadow: 'none',
            p: 0
          }
        }}
      >
        <SeatingPlanTable />
      </Paper>

      {/* Instructions d'utilisation */}
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="600">
          Instructions d'utilisation
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Impression :</strong> Utilisez le bouton "Imprimer" pour imprimer le plan en format A3 paysage
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Zones blanches :</strong> Les rectangles blancs sont prévus pour inscrire les noms des résidents à la main
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Couleurs :</strong> Les tables beiges correspondent au 1er service, les tables roses au 2e service
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Symboles :</strong> Utilisez la légende pour indiquer les besoins spécifiques de chaque résident
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Téléchargement :</strong> SVG pour édition vectorielle, PNG pour partage et affichage
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default SeatingPlanPage;
