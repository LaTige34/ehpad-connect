import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Alert, 
  CircularProgress
} from '@mui/material';

import { forgotPassword } from '../../store/slices/authSlice';

// Schéma de validation du formulaire
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Adresse email invalide')
    .required('Email requis')
});

/**
 * Page de mot de passe oublié
 */
const ForgotPassword = () => {
  const [success, setSuccess] = useState(false);
  const dispatch = useDispatch();
  
  const isLoading = useSelector(state => state.auth.isLoading);
  const error = useSelector(state => state.auth.error);
  
  // Fonction pour soumettre le formulaire
  const handleSubmit = async (values) => {
    try {
      await dispatch(forgotPassword(values.email)).unwrap();
      setSuccess(true);
    } catch (err) {
      // L'erreur est déjà gérée par le reducer
      console.error('Erreur lors de la demande de réinitialisation:', err);
    }
  };
  
  if (success) {
    return (
      <Box>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Email envoyé
        </Typography>
        
        <Alert severity="success" sx={{ mb: 3 }}>
          Un email de réinitialisation a été envoyé à l'adresse indiquée.
          Veuillez vérifier votre boîte de réception et suivre les instructions.
        </Alert>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="outlined" fullWidth>
              Retour à la connexion
            </Button>
          </Link>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography component="h1" variant="h5" align="center" gutterBottom>
        Mot de passe oublié
      </Typography>
      <Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 3 }}>
        Entrez votre adresse email pour recevoir un lien de réinitialisation
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Formik
        initialValues={{
          email: ''
        }}
        validationSchema={ForgotPasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form>
            <Field
              as={TextField}
              margin="normal"
              fullWidth
              id="email"
              label="Adresse email"
              name="email"
              autoComplete="email"
              autoFocus
              error={touched.email && Boolean(errors.email)}
              helperText={touched.email && errors.email}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </Button>
          </Form>
        )}
      </Formik>
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <Typography variant="body2" color="primary">
            Retour à la connexion
          </Typography>
        </Link>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
