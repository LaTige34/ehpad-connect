import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

// Importation des reducers
import authReducer from './slices/authSlice';
import planningReducer from './slices/planningSlice';
import documentReducer from './slices/documentSlice';
import uiReducer from './slices/uiSlice';
import notificationReducer from './slices/notificationSlice';

// Configuration de la persistance pour maintenir l'état entre les rafraîchissements
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'] // Seuls les éléments d'auth sont persistés
};

const rootReducer = combineReducers({
  auth: authReducer,
  planning: planningReducer,
  document: documentReducer,
  ui: uiReducer,
  notification: notificationReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Création du store avec middlewares
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorer les actions non-sérialisables de redux-persist
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
});

// Persistor pour PersistGate
export const persistor = persistStore(store);

// Exporter le RootState et AppDispatch pour le typage TypeScript
export const RootState = store.getState;
export const AppDispatch = store.dispatch;
