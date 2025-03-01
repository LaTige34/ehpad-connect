import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Link
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { forgotPassword } from '../../store/slices/authSlice';

/**
 * Page de récupération de mot de passe
 */
const ForgotPassword = () => {
  const [success, setSuccess] = useState(false);
  const dispatch = useDispatch();
  
  // Récupération des états depuis Redux
  const { isLoading, error } = useSelector(state => state.auth);
  
  // Schéma de validation
  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Email invalide')
      .required('L\'email est requis')
  });
  
  // Configuration du formulaire avec Formik
  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema,
    onSubmit: (values) => {
      dispatch(forgotPassword(values.email))
        .unwrap()
        .then(() => {
          setSuccess(true);
        })
        .catch(() => {
          // L'erreur est déjà gérée par le reducer
        });
    }
  });
  
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" component="h2" align="center" gutterBottom>
        Mot de passe oublié
      </Typography>
      
      {!success ? (
        <>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Entrez votre adresse email pour recevoir un lien de réinitialisation de mot de passe.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled={isLoading}
            />
            
            <Box sx={{ mt: 3, mb: 2 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{ py: 1.2 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </Button>
            </Box>
          </Box>
        </>
      ) : (
        <Alert severity="success" sx={{ mb: 3 }}>
          Un email contenant les instructions de réinitialisation a été envoyé à {formik.values.email}.
        </Alert>
      )}
      
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Link 
          component={RouterLink} 
          to="/login" 
          variant="body2" 
          underline="hover"
        >
          Retour à la page de connexion
        </Link>
      </Box>
      
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Mode développement : aucun email n'est réellement envoyé.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ForgotPassword;
