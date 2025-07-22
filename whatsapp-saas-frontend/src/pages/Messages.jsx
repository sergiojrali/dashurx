import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { apiClient } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
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
  MessageSquare, 
  Send,
  Search,
  Filter,
  Download,
  Upload,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Bot,
  Image,
  FileText,
  Video,
  Mic
} from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBot, setSelectedBot] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({
    bot_id: '',
    number: '',
    message: '',
    message_type: 'text'
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBot) {
      loadMessages();
    }
  }, [selectedBot, filterDirection, filterType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const botsResponse = await apiClient.getBots();
      setBots(botsResponse.bots || []);
      
      if (botsResponse.bots && botsResponse.bots.length > 0) {
        setSelectedBot(botsResponse.bots[0].id.toString());
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedBot) return;
    
    try {
      const response = await apiClient.getMessages(selectedBot, {
        direction: filterDirection !== 'all' ? filterDirection : undefined,
        message_type: filterType !== 'all' ? filterType : undefined,
        search: searchTerm || undefined
      });
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setError('Erro ao carregar mensagens');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!composeData.bot_id || !composeData.number || !composeData.message) return;

    setSending(true);
    setError('');

    try {
      await apiClient.sendMessage(composeData.bot_id, {
        number: composeData.number,
        message: composeData.message,
        message_type: composeData.message_type
      });
      
      setIsComposeOpen(false);
      setComposeData({
        bot_id: '',
        number: '',
        message: '',
        message_type: 'text'
      });
      
      // Recarregar mensagens se for do bot selecionado
      if (composeData.bot_id === selectedBot) {
        loadMessages();
      }
    } catch (error) {
      setError(error.message || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Mic className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'read':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatPhoneNumber = (number) => {
    if (!number) return '';
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.startsWith('55')) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return number;
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = !searchTerm || 
      message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.contact_number?.includes(searchTerm);
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mensagens</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie e monitore as conversas dos seus bots
          </p>
        </div>
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 whatsapp-gradient text-white">
              <Send className="w-4 h-4 mr-2" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enviar Nova Mensagem</DialogTitle>
              <DialogDescription>
                Envie uma mensagem através de um dos seus bots
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
                  <Label htmlFor="compose-bot">Bot</Label>
                  <Select 
                    value={composeData.bot_id} 
                    onValueChange={(value) => setComposeData({...composeData, bot_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um bot" />
                    </SelectTrigger>
                    <SelectContent>
                      {bots.filter(bot => bot.status === 'active').map((bot) => (
                        <SelectItem key={bot.id} value={bot.id.toString()}>
                          {bot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="compose-number">Número do WhatsApp</Label>
                  <Input
                    id="compose-number"
                    value={composeData.number}
                    onChange={(e) => setComposeData({...composeData, number: e.target.value})}
                    placeholder="Ex: +5511999999999"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="compose-message">Mensagem</Label>
                  <Textarea
                    id="compose-message"
                    value={composeData.message}
                    onChange={(e) => setComposeData({...composeData, message: e.target.value})}
                    placeholder="Digite sua mensagem..."
                    rows={4}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={sending} className="whatsapp-gradient text-white">
                  {sending ? 'Enviando...' : 'Enviar Mensagem'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="bot-select">Bot</Label>
              <Select value={selectedBot} onValueChange={setSelectedBot}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um bot" />
                </SelectTrigger>
                <SelectContent>
                  {bots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id.toString()}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar mensagens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="direction-filter">Direção</Label>
              <Select value={filterDirection} onValueChange={setFilterDirection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="incoming">Recebidas</SelectItem>
                  <SelectItem value="outgoing">Enviadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="audio">Áudio</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de Mensagens */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Mensagens {selectedBot && `- ${bots.find(b => b.id.toString() === selectedBot)?.name}`}
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
          <CardDescription>
            {filteredMessages.length} mensagem(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedBot ? 'Nenhuma mensagem encontrada' : 'Selecione um bot para ver as mensagens'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div key={message.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex items-center space-x-2">
                        {message.direction === 'incoming' ? (
                          <User className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Bot className="w-5 h-5 text-green-500" />
                        )}
                        {getMessageTypeIcon(message.message_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">
                            {message.contact_name || formatPhoneNumber(message.contact_number)}
                          </span>
                          <Badge variant={message.direction === 'incoming' ? 'secondary' : 'default'}>
                            {message.direction === 'incoming' ? 'Recebida' : 'Enviada'}
                          </Badge>
                          <Badge variant="outline">
                            {message.message_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {formatPhoneNumber(message.contact_number)}
                        </p>
                        <p className="text-sm">
                          {message.content || (
                            <span className="italic text-muted-foreground">
                              {message.message_type === 'image' && 'Imagem'}
                              {message.message_type === 'video' && 'Vídeo'}
                              {message.message_type === 'audio' && 'Áudio'}
                              {message.message_type === 'document' && 'Documento'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      {getStatusIcon(message.status)}
                      <span>
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Messages;

