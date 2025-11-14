import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Save as SaveIcon,
  Edit as EditIcon
} from '@mui/icons-material';

/**
 * Page de profil utilisateur
 */
const ProfilePage = () => {
  const user = useSelector(state => state.auth.user) || {
    name: 'Utilisateur',
    email: 'user@ehpad-belleviste.fr',
    role: 'Infirmier(ère)',
    phone: '06 12 34 56 78',
    service: 'Service 1'
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    service: user.service
  });

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowSuccess(false);
  };

  const handleSave = () => {
    // Logique de sauvegarde
    // Dans une vraie application, ceci ferait un appel API
    console.log('Sauvegarde du profil', formData);
    setIsEditing(false);
    setShowSuccess(true);

    // Masquer le message de succès après 3 secondes
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      service: user.service
    });
    setIsEditing(false);
    setShowSuccess(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'primary.main',
              fontSize: '2.5rem',
              mr: 3
            }}
          >
            {user.name.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Mon Profil
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user.role}
            </Typography>
          </Box>
          {!isEditing && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Modifier
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {showSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Vos informations ont été mises à jour avec succès !
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nom complet"
              value={formData.name}
              onChange={handleChange('name')}
              disabled={!isEditing}
              variant={isEditing ? 'outlined' : 'filled'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              disabled={!isEditing}
              variant={isEditing ? 'outlined' : 'filled'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Téléphone"
              value={formData.phone}
              onChange={handleChange('phone')}
              disabled={!isEditing}
              variant={isEditing ? 'outlined' : 'filled'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Service"
              value={formData.service}
              onChange={handleChange('service')}
              disabled={!isEditing}
              variant={isEditing ? 'outlined' : 'filled'}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Rôle"
              value={user.role}
              disabled
              variant="filled"
              helperText="Le rôle ne peut pas être modifié"
            />
          </Grid>
        </Grid>

        {isEditing && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Enregistrer
            </Button>
          </Box>
        )}
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informations de compte
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Identifiant
            </Typography>
            <Typography variant="body1">
              {user.email}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Date de création du compte
            </Typography>
            <Typography variant="body1">
              {new Date().toLocaleDateString('fr-FR')}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="outlined"
              color="error"
              sx={{ mt: 2 }}
            >
              Changer le mot de passe
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
