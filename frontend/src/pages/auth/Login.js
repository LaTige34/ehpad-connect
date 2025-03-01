import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  CircularProgress, 
  InputAdornment,
  IconButton,
  Alert,
  Link
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { login, resetError, simulateLogin } from '../../store/slices/authSlice';

/**
 * Page de connexion de l'application
 */
const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Récupération des états depuis Redux
  const { isLoading, error, isAuthenticated } = useSelector(state => state.auth);
  
  // Redirection si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Schéma de validation
  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Email invalide')
      .required('L\'email est requis'),
    password: Yup.string()
      .required('Le mot de passe est requis')
  });
  
  // Configuration du formulaire avec Formik
  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema,
    onSubmit: (values) => {
      // En développement, on simule l'authentification
      if (process.env.NODE_ENV === 'development') {
        dispatch(simulateLogin());
      } else {
        dispatch(login(values));
      }
    }
  });
  
  // Gestionnaire pour afficher/masquer le mot de passe
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Nettoyage des messages d'erreur lors de la modification du formulaire
  useEffect(() => {
    if (error) {
      dispatch(resetError());
    }
  }, [formik.values, dispatch, error]);
  
  return (
    <Box component="form" onSubmit={formik.handleSubmit} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
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
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Mot de passe"
        type={showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="current-password"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.password && Boolean(formik.errors.password)}
        helperText={formik.touched.password && formik.errors.password}
        disabled={isLoading}
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
          )
        }}
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
            'Connexion'
          )}
        </Button>
      </Box>
      
      <Box sx={{ textAlign: 'center' }}>
        <Link 
          component={RouterLink} 
          to="/forgot-password" 
          variant="body2" 
          underline="hover"
        >
          Mot de passe oublié ?
        </Link>
      </Box>

      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Mode développement : la connexion est simulée.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Login;
