import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Alert, 
  InputAdornment, 
  IconButton,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

import { login, simulateLogin } from '../../store/slices/authSlice';

// Schéma de validation du formulaire
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Adresse email invalide')
    .required('Email requis'),
  password: Yup.string()
    .required('Mot de passe requis')
});

/**
 * Page de connexion
 */
const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const isLoading = useSelector(state => state.auth.isLoading);
  const error = useSelector(state => state.auth.error);
  
  // Fonction pour soumettre le formulaire
  const handleSubmit = async (values) => {
    if (process.env.NODE_ENV === 'development') {
      // En mode développement, utiliser la simulation de connexion
      dispatch(simulateLogin());
      navigate('/');
    } else {
      // En production, appeler l'API
      const result = await dispatch(login(values));
      if (!result.error) {
        navigate('/');
      }
    }
  };
  
  // Gestion de l'affichage/masquage du mot de passe
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <Box>
      <Typography component="h1" variant="h5" align="center" gutterBottom>
        Connexion
      </Typography>
      <Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 3 }}>
        Accédez à votre espace personnel
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Formik
        initialValues={{
          email: '',
          password: ''
        }}
        validationSchema={LoginSchema}
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
            
            <Field
              as={TextField}
              margin="normal"
              fullWidth
              name="password"
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              error={touched.password && Boolean(errors.password)}
              helperText={touched.password && errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
                'Se connecter'
              )}
            </Button>
          </Form>
        )}
      </Formik>
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
          <Typography variant="body2" color="primary">
            Mot de passe oublié ?
          </Typography>
        </Link>
      </Box>
    </Box>
  );
};

export default Login;
