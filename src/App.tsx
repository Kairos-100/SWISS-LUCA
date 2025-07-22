import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, CssBaseline, TextField, Box, Paper, Alert, Card, CardContent, CardMedia, CardActions, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Input, List, ListItem, ListItemText, Switch, FormControlLabel } from '@mui/material';
import Grid from '@mui/material/Grid';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import './App.css'
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut, updatePassword, onAuthStateChanged } from 'firebase/auth';

function useFirebaseAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      return false;
    }
  };
  const logout = async () => {
    await signOut(auth);
  };
  return { isAuthenticated, login, logout };
}

function LoginPage({ onLogin }: { onLogin: (email: string, password: string) => Promise<boolean> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await onLogin(email, password)) {
      navigate('/');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>Admin Login</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

function ProtectedRoute({ isAuthenticated, children }: { isAuthenticated: boolean, children: React.ReactNode }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// Card data type
interface SummaryCard {
  id: string;
  image: string;
  title: string;
  price: string;
  oldPrice?: string;
  discount?: string;
  features: string[];
  description: string;
}

const initialCards: SummaryCard[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    title: 'Chalet adosado en calle Joan Fuster, Canet d\'En Berenguer',
    price: '380.000 €',
    oldPrice: '400.000 €',
    discount: '5%',
    features: ['4 hab.', '192 m²', 'Garaje incluido'],
    description: '¡Descubre este fantástico chalet adosado en Canet d\'En Berenguer a un paso del mar! Magnifica vivienda de 192m² construidos sobre una parcela de...'
  }
];

function Dashboard() {
  const [cards, setCards] = useState<SummaryCard[]>(initialCards);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCard, setEditCard] = useState<SummaryCard | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = (card: SummaryCard) => {
    navigate(`/details/${card.id}`);
  };

  const handleEdit = (card: SummaryCard) => {
    setEditCard(card);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCards(cards.filter(card => card.id !== id));
  };

  const handleAdd = () => {
    setEditCard({ id: '', image: '', title: '', price: '', features: [], description: '' });
    setAddDialogOpen(true);
  };

  const handleEditSave = () => {
    if (editCard) {
      setCards(cards.map(card => card.id === editCard.id ? editCard : card));
      setEditDialogOpen(false);
    }
  };

  const handleAddSave = () => {
    if (editCard) {
      setCards([...cards, { ...editCard, id: Date.now().toString() }]);
      setAddDialogOpen(false);
    }
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ mb: 2 }}>Add Card</Button>
      <Grid container spacing={2}>
        {cards.map(card => (
          <Grid key={card.id} component="div">
            <Card sx={{ cursor: 'pointer' }}>
              <CardMedia component="img" height="140" image={card.image} alt={card.title} onClick={() => handleCardClick(card)} />
              <CardContent onClick={() => handleCardClick(card)}>
                <Typography variant="h6" color="primary">{card.title}</Typography>
                <Typography variant="h5" fontWeight="bold">{card.price} {card.oldPrice && <><s style={{ color: 'red', fontSize: 16, marginLeft: 8 }}>{card.oldPrice}</s></>} {card.discount && <span style={{ color: 'red', fontWeight: 500, marginLeft: 8 }}>↓ {card.discount}</span>}</Typography>
                <Typography variant="body2" color="text.secondary">{card.features.join(' • ')}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>{card.description}</Typography>
              </CardContent>
              <CardActions>
                <IconButton onClick={() => handleEdit(card)}><EditIcon /></IconButton>
                <IconButton onClick={() => handleDelete(card.id)}><DeleteIcon /></IconButton>
                <IconButton onClick={() => handleCardClick(card)}><ArrowForwardIcon /></IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Card</DialogTitle>
        <DialogContent>
          <TextField label="Image URL" fullWidth margin="normal" value={editCard?.image || ''} onChange={e => setEditCard({ ...editCard!, image: e.target.value })} />
          <TextField label="Title" fullWidth margin="normal" value={editCard?.title || ''} onChange={e => setEditCard({ ...editCard!, title: e.target.value })} />
          <TextField label="Price" fullWidth margin="normal" value={editCard?.price || ''} onChange={e => setEditCard({ ...editCard!, price: e.target.value })} />
          <TextField label="Old Price" fullWidth margin="normal" value={editCard?.oldPrice || ''} onChange={e => setEditCard({ ...editCard!, oldPrice: e.target.value })} />
          <TextField label="Discount" fullWidth margin="normal" value={editCard?.discount || ''} onChange={e => setEditCard({ ...editCard!, discount: e.target.value })} />
          <TextField label="Features (comma separated)" fullWidth margin="normal" value={editCard?.features.join(', ') || ''} onChange={e => setEditCard({ ...editCard!, features: e.target.value.split(',').map(f => f.trim()) })} />
          <TextField label="Description" fullWidth margin="normal" multiline minRows={2} value={editCard?.description || ''} onChange={e => setEditCard({ ...editCard!, description: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Card</DialogTitle>
        <DialogContent>
          <TextField label="Image URL" fullWidth margin="normal" value={editCard?.image || ''} onChange={e => setEditCard({ ...editCard!, image: e.target.value })} />
          <TextField label="Title" fullWidth margin="normal" value={editCard?.title || ''} onChange={e => setEditCard({ ...editCard!, title: e.target.value })} />
          <TextField label="Price" fullWidth margin="normal" value={editCard?.price || ''} onChange={e => setEditCard({ ...editCard!, price: e.target.value })} />
          <TextField label="Old Price" fullWidth margin="normal" value={editCard?.oldPrice || ''} onChange={e => setEditCard({ ...editCard!, oldPrice: e.target.value })} />
          <TextField label="Discount" fullWidth margin="normal" value={editCard?.discount || ''} onChange={e => setEditCard({ ...editCard!, discount: e.target.value })} />
          <TextField label="Features (comma separated)" fullWidth margin="normal" value={editCard?.features.join(', ') || ''} onChange={e => setEditCard({ ...editCard!, features: e.target.value.split(',').map(f => f.trim()) })} />
          <TextField label="Description" fullWidth margin="normal" multiline minRows={2} value={editCard?.description || ''} onChange={e => setEditCard({ ...editCard!, description: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSave} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function DetailPage() {
  const { id } = useParams();
  const [card, setCard] = useState<SummaryCard | null>(null);
  useEffect(() => {
    // For now, use the same mock data as Dashboard
    const found = initialCards.find(c => c.id === id);
    setCard(found || null);
  }, [id]);
  if (!card) return <Typography>Card not found</Typography>;
  return (
    <Container maxWidth="md">
      <Card>
        <CardMedia component="img" height="300" image={card.image} alt={card.title} />
        <CardContent>
          <Typography variant="h4" color="primary">{card.title}</Typography>
          <Typography variant="h5" fontWeight="bold">{card.price} {card.oldPrice && <><s style={{ color: 'red', fontSize: 16, marginLeft: 8 }}>{card.oldPrice}</s></>} {card.discount && <span style={{ color: 'red', fontWeight: 500, marginLeft: 8 }}>↓ {card.discount}</span>}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>{card.features.join(' • ')}</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>{card.description}</Typography>
        </CardContent>
      </Card>
    </Container>
  );
}

function Users() {
  return <Typography variant="h4">Users</Typography>;
}
function Offers() {
  return <Typography variant="h4">Offers</Typography>;
}
function Settings({ onToggleDarkMode, darkMode, onExport, onImport }: { onToggleDarkMode: () => void, darkMode: boolean, onExport: () => void, onImport: (file: File) => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setPasswordMsg('Not logged in.');
      return;
    }
    try {
      await updatePassword(auth.currentUser, newPassword);
      setPasswordMsg('Password updated successfully!');
      setNewPassword('');
    } catch (err) {
      setPasswordMsg('Failed to update password.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Settings</Typography>
      <Divider sx={{ my: 2 }} />
      <FormControlLabel
        control={<Switch checked={darkMode} onChange={onToggleDarkMode} />}
        label={darkMode ? 'Dark Mode' : 'Light Mode'}
      />
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Change Password</Typography>
      <Box component="form" onSubmit={handleChangePassword} sx={{ mb: 2 }}>
        <TextField
          label="New Password"
          type="password"
          fullWidth
          margin="normal"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />
        <Button type="submit" variant="contained" sx={{ mt: 1 }}>Change Password</Button>
        {passwordMsg && <Alert severity={passwordMsg.includes('success') ? 'success' : 'error'} sx={{ mt: 2 }}>{passwordMsg}</Alert>}
      </Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Export/Import Data</Typography>
      <Button variant="outlined" onClick={onExport} sx={{ mr: 2 }}>Export Cards (JSON)</Button>
      <label htmlFor="import-file">
        <Input
          id="import-file"
          type="file"
          inputProps={{ accept: '.json' }}
          sx={{ display: 'none' }}
          onChange={e => {
            const input = e.target as HTMLInputElement;
            if (input.files && input.files[0]) onImport(input.files[0]);
          }}
        />
        <Button variant="outlined" component="span">Import Cards (JSON)</Button>
      </label>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">App Info</Typography>
      <List>
        <ListItem>
          <ListItemText primary="Version" secondary="1.0.0" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Contact" secondary="contact@totemsuisse.com" />
        </ListItem>
      </List>
    </Container>
  );
}

function App() {
  const { isAuthenticated, login, logout } = useFirebaseAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [cards, setCards] = useState<SummaryCard[]>(initialCards);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#111',
        contrastText: '#fff',
      },
      secondary: {
        main: '#888',
        contrastText: '#fff',
      },
      background: {
        default: darkMode ? '#222' : '#f5f5f5',
        paper: darkMode ? '#111' : '#fff',
      },
      text: {
        primary: darkMode ? '#fff' : '#111',
        secondary: darkMode ? '#bbb' : '#555',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#111' : '#111',
            color: '#fff',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            color: darkMode ? '#fff' : '#111',
            backgroundColor: darkMode ? '#222' : '#fff',
            border: '1px solid #111',
            '&:hover': {
              backgroundColor: darkMode ? '#333' : '#f5f5f5',
              border: '1px solid #111',
            },
          },
          containedPrimary: {
            backgroundColor: '#111',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#333',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#222' : '#fff',
            color: darkMode ? '#fff' : '#111',
            border: '1px solid #e0e0e0',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: darkMode ? '#222' : '#fff',
            color: darkMode ? '#fff' : '#111',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: darkMode ? '#fff' : '#111',
          },
        },
      },
    },
  });

  // Export cards as JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(cards, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cards.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import cards from JSON
  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          setCards(imported);
        }
      } catch (err) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {isAuthenticated && (
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1, color: '#fff' }}>
                Backoffice
              </Typography>
              <Button color="inherit" component={Link} to="/">Dashboard</Button>
              <Button color="inherit" component={Link} to="/users">Users</Button>
              <Button color="inherit" component={Link} to="/offers">Offers</Button>
              <Button color="inherit" component={Link} to="/settings">Settings</Button>
              <Button color="inherit" onClick={logout}>Logout</Button>
            </Toolbar>
          </AppBar>
        )}
        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path="/login" element={<LoginPage onLogin={login} />} />
            <Route path="/" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Dashboard /></ProtectedRoute>} />
            <Route path="/details/:id" element={<ProtectedRoute isAuthenticated={isAuthenticated}><DetailPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Users /></ProtectedRoute>} />
            <Route path="/offers" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Offers /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Settings onToggleDarkMode={() => setDarkMode(d => !d)} darkMode={darkMode} onExport={handleExport} onImport={handleImport} /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
