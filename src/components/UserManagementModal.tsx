import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Close,
  Search,
  AdminPanelSettings,
  Store,
  PersonRemove,
  CheckCircle,
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Partner } from '../types';

interface User {
  uid: string;
  email: string;
  name: string;
  isAdmin?: boolean;
  isPartner?: boolean;
  createdAt?: any;
}

interface UserManagementModalProps {
  open: boolean;
  onClose: () => void;
  currentAdminId: string;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  open,
  onClose,
  currentAdminId
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'partner' | 'none'>('none');

  useEffect(() => {
    if (open) {
      loadUsers();
      loadPartners();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const usersData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showSnackbar('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPartners = async () => {
    try {
      const partnersRef = collection(db, 'partners');
      const querySnapshot = await getDocs(partnersRef);
      const partnersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Partner[];
      setPartners(partnersData);
    } catch (error) {
      console.error('Error cargando partners:', error);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUserEmail) {
      showSnackbar('Veuillez entrer un email', 'error');
      return;
    }

    try {
      setIsLoading(true);
      
      // Buscar usuario por email
      const user = users.find(u => u.email.toLowerCase() === selectedUserEmail.toLowerCase());
      
      if (!user) {
        showSnackbar('Utilisateur introuvable', 'error');
        return;
      }

      if (user.uid === currentAdminId) {
        showSnackbar('Vous ne pouvez pas modifier vos propres permissions', 'error');
        return;
      }

      const userRef = doc(db, 'users', user.uid);

      if (selectedRole === 'admin') {
        // Asignar rol de admin
        await updateDoc(userRef, {
          isAdmin: true,
          isPartner: false
        });
        showSnackbar(`✅ Administrateur créé: ${user.email} a maintenant les permissions d'administrateur`, 'success');
      } else if (selectedRole === 'partner') {
        // Asignar rol de partner
        await updateDoc(userRef, {
          isAdmin: false,
          isPartner: true
        });
        
        // Crear o actualizar perfil de partner
        const partnerRef = doc(db, 'partners', user.uid);
        const partnerDoc = await getDoc(partnerRef);
        
        if (!partnerDoc.exists()) {
          // Crear nuevo perfil de partner
          await setDoc(partnerRef, {
            id: user.uid,
            uid: user.uid,
            email: user.email,
            name: user.name || '',
            businessName: '',
            address: '',
            location: {
              lat: 0,
              lng: 0
            },
            rating: 0,
            picture: '',
            googleMapsLink: '',
            phone: '',
            website: '',
            description: '',
            categories: [],
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        }
        
        showSnackbar(`✅ Partenaire créé: ${user.email} est maintenant partenaire et peut gérer ses offres`, 'success');
      } else {
        // Remover roles
        await updateDoc(userRef, {
          isAdmin: false,
          isPartner: false
        });
        showSnackbar(`Rôles retirés de ${user.email}`, 'success');
      }

      setSelectedUserEmail('');
      setSelectedRole('none');
      await loadUsers();
      await loadPartners();
    } catch (error) {
      console.error('Erreur lors de l\'attribution du rôle:', error);
      showSnackbar('Erreur lors de l\'attribution du rôle', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: 'admin' | 'partner') => {
    if (userId === currentAdminId) {
      showSnackbar('No puedes modificar tus propios permisos', 'error');
      return;
    }

    if (!window.confirm(`¿Estás seguro de remover el rol de ${role} de este usuario?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const userRef = doc(db, 'users', userId);
      
      if (role === 'admin') {
        await updateDoc(userRef, {
          isAdmin: false
        });
      } else {
        await updateDoc(userRef, {
          isPartner: false
        });
      }
      
      showSnackbar('Rol removido correctamente', 'success');
      await loadUsers();
      await loadPartners();
    } catch (error) {
      console.error('Error removiendo rol:', error);
      showSnackbar('Error al remover rol', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #1A1A1A 0%, #2A2A2A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 160, 0, 0.1) 100%)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ 
              color: '#FFD700',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Gestión de Usuarios
            </Typography>
            <IconButton 
              onClick={onClose}
              sx={{
                color: '#FFD700',
                '&:hover': {
                  bgcolor: 'rgba(255, 215, 0, 0.1)'
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1A1A1A', color: '#FFFFFF' }}>
          <Box sx={{ mt: 2 }}>
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3,
                bgcolor: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  color: '#FFD700'
                }
              }}
            >
              <Typography variant="body2" component="div" sx={{ color: '#FFFFFF' }}>
                <strong style={{ color: '#FFD700' }}>Gestion des Rôles:</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#B0B0B0' }}>
                  <li><strong style={{ color: '#FFD700' }}>Administrateur:</strong> Peut gérer les offres, flash deals et utilisateurs</li>
                  <li><strong style={{ color: '#FFD700' }}>Partenaire:</strong> Peut gérer son profil et créer ses propres offres/flash deals</li>
                </ul>
                <strong style={{ color: '#FFD700' }}>Note:</strong> Seuls les administrateurs peuvent créer et attribuer des partenaires.
              </Typography>
            </Alert>

            {/* Formulario para asignar roles */}
            <Paper sx={{ 
              p: 3, 
              mb: 3, 
              background: 'linear-gradient(145deg, #1A1A1A 0%, #2A2A2A 100%)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#FFD700', fontWeight: 600 }}>
                Crear/Asignar Roles
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#B0B0B0' }}>
                Busca un usuario por email y asígnale el rol de <strong style={{ color: '#FFD700' }}>Administrador</strong> o <strong style={{ color: '#FFD700' }}>Partner</strong>.
                Al asignar Partner, se crea automáticamente su perfil de partner.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <TextField
                  label="Email del Usuario"
                  value={selectedUserEmail}
                  onChange={(e) => setSelectedUserEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  sx={{ 
                    flex: 1, 
                    minWidth: 200,
                    '& .MuiOutlinedInput-root': {
                      color: '#FFFFFF',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 215, 0, 0.5)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FFD700'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#B0B0B0'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#FFD700'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#FFD700' }} />
                      </InputAdornment>
                    )
                  }}
                />
                <TextField
                  select
                  label="Rol"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'partner' | 'none')}
                  sx={{ 
                    minWidth: 150,
                    '& .MuiOutlinedInput-root': {
                      color: '#FFFFFF',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 215, 0, 0.5)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FFD700'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#B0B0B0'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#FFD700'
                    },
                    '& .MuiSelect-icon': {
                      color: '#FFD700'
                    }
                  }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: '#1A1A1A',
                          border: '1px solid rgba(255, 215, 0, 0.2)'
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="none" sx={{ color: '#B0B0B0' }}>Sin rol</MenuItem>
                  <MenuItem value="admin" sx={{ color: '#FFFFFF' }}>Administrador</MenuItem>
                  <MenuItem value="partner" sx={{ color: '#FFFFFF' }}>Partner</MenuItem>
                </TextField>
                <Button
                  variant="contained"
                  onClick={handleAssignRole}
                  disabled={isLoading || !selectedUserEmail || selectedRole === 'none'}
                  startIcon={isLoading ? <CircularProgress size={20} sx={{ color: '#000' }} /> : <CheckCircle />}
                  sx={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
                    color: '#000000',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FFA000 0%, #FF8F00 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(255, 215, 0, 0.3)'
                    },
                    '&:disabled': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                >
                  Asignar
                </Button>
              </Box>
            </Paper>

            {/* Búsqueda */}
            <TextField
              fullWidth
              label="Buscar usuarios"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 215, 0, 0.5)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FFD700',
                    boxShadow: '0 0 0 2px rgba(255, 215, 0, 0.2)'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#B0B0B0'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#FFD700'
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#FFD700' }} />
                  </InputAdornment>
                )
              }}
            />

            {/* Tabla de usuarios */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2, color: '#FFD700', fontWeight: 600 }}>
              Lista de Usuarios ({filteredUsers.length})
            </Typography>
            <TableContainer 
              component={Paper}
              sx={{
                background: 'linear-gradient(145deg, #1A1A1A 0%, #2A2A2A 100%)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    bgcolor: 'rgba(255, 215, 0, 0.1)',
                    borderBottom: '2px solid rgba(255, 215, 0, 0.3)'
                  }}>
                    <TableCell sx={{ color: '#FFD700', fontWeight: 600 }}><strong>Email</strong></TableCell>
                    <TableCell sx={{ color: '#FFD700', fontWeight: 600 }}><strong>Nombre</strong></TableCell>
                    <TableCell sx={{ color: '#FFD700', fontWeight: 600 }}><strong>Roles</strong></TableCell>
                    <TableCell sx={{ color: '#FFD700', fontWeight: 600 }}><strong>Estado Partner</strong></TableCell>
                    <TableCell sx={{ color: '#FFD700', fontWeight: 600 }}><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading && users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">
                          {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      const partnerProfile = partners.find(p => p.uid === user.uid);
                      return (
                        <TableRow 
                        key={user.uid}
                        sx={{
                          '&:hover': {
                            bgcolor: 'rgba(255, 215, 0, 0.05)'
                          },
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                          <TableCell sx={{ color: '#FFFFFF' }}>{user.email}</TableCell>
                          <TableCell sx={{ color: '#FFFFFF' }}>{user.name || 'Sin nombre'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {user.isAdmin && (
                              <Chip
                                icon={<AdminPanelSettings sx={{ color: '#2196F3' }} />}
                                label="Admin"
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(33, 150, 243, 0.2)',
                                  color: '#2196F3',
                                  border: '1px solid rgba(33, 150, 243, 0.3)',
                                  fontWeight: 600
                                }}
                              />
                            )}
                            {user.isPartner && (
                              <Chip
                                icon={<Store sx={{ color: '#FFD700' }} />}
                                label="Partner"
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255, 215, 0, 0.2)',
                                  color: '#FFD700',
                                  border: '1px solid rgba(255, 215, 0, 0.3)',
                                  fontWeight: 600
                                }}
                              />
                            )}
                            {!user.isAdmin && !user.isPartner && (
                              <Chip
                                label="Usuario"
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: 'rgba(255, 255, 255, 0.2)',
                                  color: '#B0B0B0'
                                }}
                              />
                            )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {user.isPartner ? (
                              partnerProfile ? (
                                <Chip
                                  label={`Perfil: ${partnerProfile.businessName || 'Sin nombre de negocio'}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    borderColor: 'rgba(76, 175, 80, 0.3)',
                                    color: '#4CAF50',
                                    bgcolor: 'rgba(76, 175, 80, 0.1)'
                                  }}
                                />
                              ) : (
                                <Chip
                                  label="Perfil pendiente"
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    borderColor: 'rgba(255, 152, 0, 0.3)',
                                    color: '#FF9800',
                                    bgcolor: 'rgba(255, 152, 0, 0.1)'
                                  }}
                                />
                              )
                            ) : (
                              <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                                No es partner
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {user.isAdmin && user.uid !== currentAdminId && (
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveRole(user.uid, 'admin')}
                                title="Remover admin"
                                sx={{
                                  color: '#F44336',
                                  '&:hover': {
                                    bgcolor: 'rgba(244, 67, 54, 0.1)'
                                  }
                                }}
                              >
                                <PersonRemove />
                              </IconButton>
                            )}
                            {user.isPartner && user.uid !== currentAdminId && (
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveRole(user.uid, 'partner')}
                                title="Remover partner"
                                sx={{
                                  color: '#F44336',
                                  '&:hover': {
                                    bgcolor: 'rgba(244, 67, 54, 0.1)'
                                  }
                                }}
                              >
                                <PersonRemove />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          bgcolor: '#1A1A1A',
          borderTop: '1px solid rgba(255, 215, 0, 0.2)',
          p: 2
        }}>
          <Button 
            onClick={onClose}
            sx={{
              color: '#FFD700',
              borderColor: '#FFD700',
              '&:hover': {
                borderColor: '#FFA000',
                bgcolor: 'rgba(255, 215, 0, 0.1)'
              }
            }}
            variant="outlined"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{
            bgcolor: snackbar.severity === 'success' 
              ? 'rgba(76, 175, 80, 0.1)' 
              : 'rgba(244, 67, 54, 0.1)',
            border: `1px solid ${snackbar.severity === 'success' 
              ? 'rgba(76, 175, 80, 0.3)' 
              : 'rgba(244, 67, 54, 0.3)'}`,
            color: snackbar.severity === 'success' ? '#4CAF50' : '#F44336',
            borderRadius: 2
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

