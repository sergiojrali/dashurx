import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { apiClient } from '../lib/api';
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
  Bot, 
  Plus,
  Settings,
  Play,
  Pause,
  Trash2,
  Edit,
  QrCode,
  MessageSquare,
  Users,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import '../App.css';

const Bots = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone_number: '',
    welcome_message: 'Olá! Como posso ajudá-lo hoje?',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getBots();
      setBots(response.bots || []);
    } catch (error) {
      console.error('Erro ao carregar bots:', error);
      setError('Erro ao carregar bots');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await apiClient.createBot(formData);
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        phone_number: '',
        welcome_message: 'Olá! Como posso ajudá-lo hoje?',
      });
      await loadBots();
    } catch (error) {
      setError(error.message || 'Erro ao criar bot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBot = async (e) => {
    e.preventDefault();
    if (!selectedBot) return;

    setSubmitting(true);
    setError('');

    try {
      await apiClient.updateBot(selectedBot.id, formData);
      setIsEditDialogOpen(false);
      setSelectedBot(null);
      setFormData({
        name: '',
        description: '',
        phone_number: '',
        welcome_message: 'Olá! Como posso ajudá-lo hoje?',
      });
      await loadBots();
    } catch (error) {
      setError(error.message || 'Erro ao atualizar bot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBot = async (botId) => {
    if (!confirm('Tem certeza que deseja excluir este bot?')) return;

    try {
      await apiClient.deleteBot(botId);
      await loadBots();
    } catch (error) {
      setError(error.message || 'Erro ao excluir bot');
    }
  };

  const handleStartBot = async (botId) => {
    try {
      await apiClient.startBot(botId);
      await loadBots();
    } catch (error) {
      setError(error.message || 'Erro ao iniciar bot');
    }
  };

  const handleStopBot = async (botId) => {
    try {
      await apiClient.stopBot(botId);
      await loadBots();
    } catch (error) {
      setError(error.message || 'Erro ao parar bot');
    }
  };

  const openEditDialog = (bot) => {
    setSelectedBot(bot);
    setFormData({
      name: bot.name,
      description: bot.description || '',
      phone_number: bot.phone_number || '',
      welcome_message: bot.welcome_message || 'Olá! Como posso ajudá-lo hoje?',
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-800' },
      connecting: { label: 'Conectando', className: 'bg-yellow-100 text-yellow-800' },
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
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-foreground">Meus Bots</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus bots de WhatsApp
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 whatsapp-gradient text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Bot</DialogTitle>
              <DialogDescription>
                Configure seu novo bot de WhatsApp
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateBot}>
              <div className="grid gap-4 py-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Bot</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Atendimento Loja"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva a função do seu bot"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone_number">Número do WhatsApp</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="Ex: +5511999999999"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="welcome_message">Mensagem de Boas-vindas</Label>
                  <Textarea
                    id="welcome_message"
                    value={formData.welcome_message}
                    onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                    placeholder="Mensagem inicial do bot"
                    rows={3}
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
                    'Criar Bot'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Bots Grid */}
      {bots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bot className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum bot criado</h3>
            <p className="text-muted-foreground text-center mb-6">
              Crie seu primeiro bot para começar a automatizar suas conversas no WhatsApp
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="whatsapp-gradient text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro bot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <Card key={bot.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(bot.status)}
                    <div>
                      <CardTitle className="text-lg">{bot.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {bot.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(bot.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Número:</span>
                    <span>{bot.phone_number || 'Não configurado'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Criado em:</span>
                    <span>{new Date(bot.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {bot.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStopBot(bot.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Parar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartBot(bot.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Iniciar
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(bot)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/bots/${bot.id}/flows`)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Fluxos
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/bots/${bot.id}/messages`)}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Mensagens
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteBot(bot.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Bot</DialogTitle>
            <DialogDescription>
              Atualize as configurações do seu bot
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditBot}>
            <div className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nome do Bot</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Atendimento Loja"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva a função do seu bot"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone_number">Número do WhatsApp</Label>
                <Input
                  id="edit-phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="Ex: +5511999999999"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-welcome_message">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="edit-welcome_message"
                  value={formData.welcome_message}
                  onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                  placeholder="Mensagem inicial do bot"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="whatsapp-gradient text-white">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bots;

