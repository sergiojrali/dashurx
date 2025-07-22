import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Smartphone, 
  Plus,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  QrCode,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';
import '../App.css';

const WhatsAppSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSendMessageDialogOpen, setIsSendMessageDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
  });
  const [messageData, setMessageData] = useState({
    number: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSessions();
    // Atualizar sessões a cada 5 segundos
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const getAuthToken = () => {
    return localStorage.getItem('access_token');
  };

  const apiRequest = async (url, options = {}) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro na requisição');
    }

    return response.json();
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/whatsapp-sessions/sessions');
      setSessions(data.sessions || []);
      setError('');
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      setError(error.message || 'Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await apiRequest('/api/whatsapp-sessions/sessions', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      setIsCreateDialogOpen(false);
      setFormData({ description: '' });
      await loadSessions();
    } catch (error) {
      setError(error.message || 'Erro ao criar sessão');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartSession = async (sessionId) => {
    try {
      await apiRequest(`/api/whatsapp-sessions/sessions/${sessionId}/start`, {
        method: 'POST'
      });
      await loadSessions();
    } catch (error) {
      setError(error.message || 'Erro ao iniciar sessão');
    }
  };

  const handleStopSession = async (sessionId) => {
    if (!confirm('Tem certeza que deseja parar esta sessão?')) return;

    try {
      await apiRequest(`/api/whatsapp-sessions/sessions/${sessionId}/stop`, {
        method: 'POST'
      });
      await loadSessions();
    } catch (error) {
      setError(error.message || 'Erro ao parar sessão');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Tem certeza que deseja deletar esta sessão? Esta ação não pode ser desfeita.')) return;

    try {
      await apiRequest(`/api/whatsapp-sessions/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      await loadSessions();
    } catch (error) {
      setError(error.message || 'Erro ao deletar sessão');
    }
  };

  const handleRefreshSession = async (sessionId) => {
    try {
      await apiRequest(`/api/whatsapp-sessions/sessions/${sessionId}/status`);
      await loadSessions();
    } catch (error) {
      setError(error.message || 'Erro ao atualizar sessão');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;

    setSubmitting(true);
    setError('');

    try {
      await apiRequest(`/api/whatsapp-sessions/sessions/${selectedSession.id}/send-message`, {
        method: 'POST',
        body: JSON.stringify(messageData)
      });
      
      setIsSendMessageDialogOpen(false);
      setSelectedSession(null);
      setMessageData({ number: '', message: '' });
      alert('Mensagem enviada com sucesso!');
    } catch (error) {
      setError(error.message || 'Erro ao enviar mensagem');
    } finally {
      setSubmitting(false);
    }
  };

  const openSendMessageDialog = (session) => {
    setSelectedSession(session);
    setIsSendMessageDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-800' },
      connecting: { label: 'Conectando', className: 'bg-yellow-100 text-yellow-800' },
      qr_ready: { label: 'QR Pronto', className: 'bg-blue-100 text-blue-800' },
      error: { label: 'Erro', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'connecting':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'qr_ready':
        return <QrCode className="w-5 h-5 text-blue-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <WifiOff className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sessões WhatsApp</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas conexões do WhatsApp
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={loadSessions}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="whatsapp-gradient text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Sessão
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nova Sessão WhatsApp</DialogTitle>
                <DialogDescription>
                  Crie uma nova sessão para conectar um número do WhatsApp
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSession}>
                <div className="grid gap-4 py-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição da Sessão</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Bot Atendimento, Bot Vendas..."
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting} className="whatsapp-gradient text-white">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Sessão'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Smartphone className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma sessão criada</h3>
            <p className="text-muted-foreground text-center mb-6">
              Crie sua primeira sessão para conectar um número do WhatsApp
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="whatsapp-gradient text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira sessão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(session.status)}
                    <div>
                      <CardTitle className="text-lg">{session.description}</CardTitle>
                      <CardDescription className="mt-1">
                        ID: {session.id} | Porta: {session.port}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(session.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code */}
                {session.qr_code && (
                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">Escaneie o QR Code:</p>
                    <img 
                      src={session.qr_code} 
                      alt="QR Code" 
                      className="max-w-[200px] mx-auto border border-gray-200 rounded"
                    />
                  </div>
                )}

                {/* Status Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">
                      {session.ready ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                  {session.running && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Processo:</span>
                      <span className="text-green-600 font-medium">Rodando</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {session.status === 'inactive' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartSession(session.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Iniciar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStopSession(session.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Parar
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRefreshSession(session.id)}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Atualizar
                  </Button>
                  
                  {session.ready && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openSendMessageDialog(session)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Enviar
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteSession(session.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Deletar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Send Message Dialog */}
      <Dialog open={isSendMessageDialogOpen} onOpenChange={setIsSendMessageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem</DialogTitle>
            <DialogDescription>
              Envie uma mensagem através da sessão: {selectedSession?.description}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendMessage}>
            <div className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="number">Número do WhatsApp</Label>
                <Input
                  id="number"
                  value={messageData.number}
                  onChange={(e) => setMessageData({ ...messageData, number: e.target.value })}
                  placeholder="Ex: 5511999999999"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={messageData.message}
                  onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                  placeholder="Digite sua mensagem..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="whatsapp-gradient text-white">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Mensagem'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppSessions;

