import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  Checkbox,
  FormControlLabel,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Check,
  Close,
  SecurityOutlined,
  Email
} from '@mui/icons-material';

/**
 * Page de signature de document
 */
const SignDocument = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const signatureCanvasRef = useRef(null);
  
  // États du processus de signature
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [document, setDocument] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [signingInProgress, setSigningInProgress] = useState(false);
  const [signatureComplete, setSignatureComplete] = useState(false);
  
  // Étapes du processus de signature
  const steps = [
    'Vérification du document',
    'Signature',
    'Confirmation'
  ];
  
  // Simuler le chargement des données du document
  useEffect(() => {
    setIsLoading(true);
    
    // Simuler un appel API
    setTimeout(() => {
      // Données simulées du document à signer
      const mockDocument = {
        id: parseInt(id),
        title: id === '2' ? 'Avenant au contrat' : 'Document ' + id,
        type: 'amendment',
        status: 'pending',
        date: '28/02/2025',
        pages: 3,
        fileSize: '250KB',
        fileType: 'application/pdf',
        previewUrl: '/api/documents/2/preview' // URL fictive pour la prévisualisation
      };
      
      setDocument(mockDocument);
      setIsLoading(false);
    }, 1000);
  }, [id]);
  
  // Gérer le changement d'étape
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Gérer l'acceptation des termes
  const handleTermsAcceptedChange = (event) => {
    setTermsAccepted(event.target.checked);
  };
  
  // Gérer le changement de méthode de signature
  const handleSignatureMethodChange = (method) => {
    setSignatureMethod(method);
  };
  
  // Gérer la saisie de signature tapée
  const handleTypedSignatureChange = (event) => {
    setTypedSignature(event.target.value);
  };
  
  // Ouvrir la boîte de dialogue de confirmation
  const handleOpenConfirmDialog = () => {
    setConfirmDialogOpen(true);
  };
  
  // Fermer la boîte de dialogue de confirmation
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };
  
  // Simuler le processus de signature
  const handleSignDocument = () => {
    setSigningInProgress(true);
    handleCloseConfirmDialog();
    
    // Simuler un appel API pour la signature
    setTimeout(() => {
      setSigningInProgress(false);
      setSignatureComplete(true);
      handleNext();
    }, 2000);
  };
  
  // Téléchargement du document
  const handleDownloadDocument = () => {
    alert(`Téléchargement du document ${id} (simulation)`);
  };
  
  // Envoi du document signé par email
  const handleSendByEmail = () => {
    alert(`Envoi du document ${id} signé par email à mathieu.desobry@ehpadbelleviste.fr (simulation)`);
  };
  
  // Retour à la liste des documents
  const handleBackToDocuments = () => {
    navigate('/documents');
  };
  
  // Contenu de l'étape 1 : Vérification du document
  const renderVerificationStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Vérifiez le document avant de le signer
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Important</AlertTitle>
        Veuillez lire attentivement le document avant de le signer. Une fois signé, le document aura une valeur légale.
      </Alert>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              {document.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Type: {document.type === 'amendment' ? 'Avenant au contrat' : document.type}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Date: {document.date}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pages: {document.pages}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownloadDocument}
          >
            Télécharger
          </Button>
        </Box>
      </Paper>
      
      {/* Prévisualisation du document (simulée) */}
      <Paper 
        elevation={1} 
        sx={{ 
          height: '400px', 
          mb: 3, 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fafafa'
        }}
      >
        <Box textAlign="center" p={4}>
          <Typography variant="h6" gutterBottom>
            Prévisualisation du document
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cette zone contiendrait normalement une prévisualisation du document PDF.
          </Typography>
          <Button variant="contained">
            Ouvrir le document complet
          </Button>
        </Box>
      </Paper>
      
      <FormControlLabel
        control={
          <Checkbox
            checked={termsAccepted}
            onChange={handleTermsAcceptedChange}
            color="primary"
          />
        }
        label="J'ai lu le document et j'accepte de le signer électroniquement"
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button 
          variant="contained" 
          onClick={handleNext}
          disabled={!termsAccepted}
        >
          Continuer
        </Button>
      </Box>
    </Box>
  );
  
  // Contenu de l'étape 2 : Signature
  const renderSignatureStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Signez le document
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Choisissez votre méthode de signature préférée. Cette signature électronique sera légalement valide.
      </Alert>
      
      {/* Options de méthode de signature */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant={signatureMethod === 'draw' ? 'contained' : 'outlined'}
          onClick={() => handleSignatureMethodChange('draw')}
        >
          Dessiner
        </Button>
        <Button
          variant={signatureMethod === 'type' ? 'contained' : 'outlined'}
          onClick={() => handleSignatureMethodChange('type')}
        >
          Taper
        </Button>
      </Box>
      
      {/* Zone de signature */}
      {signatureMethod === 'draw' ? (
        <Paper 
          elevation={1}
          sx={{ 
            height: '200px', 
            mb: 3, 
            backgroundColor: '#fafafa',
            border: '1px dashed #ccc',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Dessinez votre signature ici
          </Typography>
          <Button size="small" variant="outlined">
            Effacer
          </Button>
        </Paper>
      ) : (
        <TextField
          fullWidth
          label="Tapez votre nom complet"
          variant="outlined"
          value={typedSignature}
          onChange={handleTypedSignatureChange}
          sx={{ mb: 3 }}
        />
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={handleBack}>
          Retour
        </Button>
        <Button 
          variant="contained" 
          onClick={handleOpenConfirmDialog}
          disabled={signatureMethod === 'type' && !typedSignature}
        >
          Signer le document
        </Button>
      </Box>
    </Box>
  );
  
  // Contenu de l'étape 3 : Confirmation
  const renderConfirmationStep = () => (
    <Box textAlign="center">
      <Box sx={{ mb: 3, color: 'success.main', fontSize: '64px' }}>
        <Check fontSize="inherit" />
      </Box>
      
      <Typography variant="h5" gutterBottom>
        Document signé avec succès !
      </Typography>
      
      <Typography variant="body1" paragraph>
        Le document a été signé électroniquement et horodaté.
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Une copie du document signé a été envoyée à votre adresse email et à l'administrateur (mathieu.desobry@ehpadbelleviste.fr).
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleDownloadDocument}
        >
          Télécharger
        </Button>
        <Button
          variant="outlined"
          startIcon={<Email />}
          onClick={handleSendByEmail}
        >
          Envoyer par email
        </Button>
      </Box>
      
      <Button
        variant="contained"
        onClick={handleBackToDocuments}
        sx={{ mt: 4 }}
      >
        Retour aux documents
      </Button>
    </Box>
  );
  
  // Rendu en fonction de l'étape active
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderVerificationStep();
      case 1:
        return renderSignatureStep();
      case 2:
        return renderConfirmationStep();
      default:
        return 'Étape inconnue';
    }
  };
  
  return (
    <Box>
      <Box display="flex" alignItems="center" sx={{ mb: 3 }}>
        <IconButton 
          edge="start" 
          onClick={handleBackToDocuments} 
          sx={{ mr: 1 }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Signature de document
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <CircularProgress />
          </Box>
        ) : errorMessage ? (
          <Alert severity="error">
            <AlertTitle>Erreur</AlertTitle>
            {errorMessage}
          </Alert>
        ) : (
          <div>
            {getStepContent(activeStep)}
          </div>
        )}
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center">
          <SecurityOutlined color="primary" sx={{ mr: 2 }} />
          <Box>
            <Typography variant="subtitle1">
              Signature électronique sécurisée
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cette signature électronique est conforme aux normes eIDAS. Tous les documents signés sont horodatés et archivés de manière sécurisée.
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Boîte de dialogue de confirmation */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>Confirmer la signature</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir signer ce document ? Cette action est définitive et ne peut pas être annulée.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Annuler
          </Button>
          <Button 
            onClick={handleSignDocument} 
            color="primary" 
            variant="contained"
            autoFocus
          >
            Confirmer la signature
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Overlay de chargement pendant la signature */}
      <Dialog open={signingInProgress} disableEscapeKeyDown>
        <DialogContent>
          <Box display="flex" alignItems="center">
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <DialogContentText>
              Signature du document en cours...
            </DialogContentText>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SignDocument;
