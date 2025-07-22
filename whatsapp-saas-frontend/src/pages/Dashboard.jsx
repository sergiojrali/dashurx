import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { apiClient } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Bot, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Plus,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../App.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBots: 0,
    activeBots: 0,
    totalMessages: 0,
    totalContacts: 0,
  });
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dados fictícios para o gráfico
  const chartData = [
    { name: 'Jan', messages: 400 },
    { name: 'Fev', messages: 300 },
    { name: 'Mar', messages: 600 },
    { name: 'Abr', messages: 800 },
    { name: 'Mai', messages: 700 },
    { name: 'Jun', messages: 900 },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const botsResponse = await apiClient.getBots();
      const botsData = botsResponse.bots || [];
      setBots(botsData);

      // Calcular estatísticas
      const activeBots = botsData.filter(bot => bot.status === 'active').length;
      setStats({
        totalBots: botsData.length,
        activeBots: activeBots,
        totalMessages: 1250, // Dados fictícios
        totalContacts: 89, // Dados fictícios
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inativo', variant: 'secondary', className: 'bg-gray-100 text-gray-800' },
      connecting: { label: 'Conectando', variant: 'default', className: 'bg-yellow-100 text-yellow-800' },
      error: { label: 'Erro', variant: 'destructive', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
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
          <h1 className="text-3xl font-bold text-foreground">
            Olá, {user?.first_name || user?.username}! 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            Aqui está um resumo da sua plataforma de chatbots
          </p>
        </div>
        <Button 
          onClick={() => navigate('/bots')}
          className="mt-4 sm:mt-0 whatsapp-gradient text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Bot
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Bots</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBots}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeBots} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              +5 novos esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">
              +2% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de mensagens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Mensagens por Mês
            </CardTitle>
            <CardDescription>
              Volume de mensagens enviadas nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lista de bots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Seus Bots
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/bots')}
              >
                Ver todos
              </Button>
            </CardTitle>
            <CardDescription>
              Status dos seus bots de WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bots.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Você ainda não tem bots criados
                  </p>
                  <Button 
                    className="mt-4 whatsapp-gradient text-white"
                    onClick={() => navigate('/bots')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeiro bot
                  </Button>
                </div>
              ) : (
                bots.slice(0, 5).map((bot) => (
                  <div key={bot.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(bot.status)}
                      <div>
                        <p className="font-medium">{bot.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {bot.phone_number || 'Número não configurado'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(bot.status)}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as funcionalidades mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/bots')}
            >
              <Bot className="w-6 h-6" />
              <span>Gerenciar Bots</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/messages')}
            >
              <MessageSquare className="w-6 h-6" />
              <span>Ver Mensagens</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/reports')}
            >
              <BarChart3 className="w-6 h-6" />
              <span>Relatórios</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/settings')}
            >
              <Activity className="w-6 h-6" />
              <span>Configurações</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

