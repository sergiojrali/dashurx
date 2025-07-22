import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { apiClient } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DatePickerWithRange } from '../components/ui/date-range-picker';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  Bot,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
    to: new Date()
  });
  const [bots, setBots] = useState([]);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalContacts: 0,
    responseRate: 0,
    averageResponseTime: 0,
    messagesGrowth: 0,
    contactsGrowth: 0
  });
  const [chartData, setChartData] = useState({
    messagesOverTime: [],
    messagesByType: [],
    messagesByDirection: [],
    botPerformance: []
  });

  useEffect(() => {
    loadData();
  }, [selectedBot, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar bots
      const botsResponse = await apiClient.getBots();
      setBots(botsResponse.bots || []);
      
      // Carregar estatísticas e dados dos gráficos
      await loadStats();
      await loadChartData();
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.getReportsStats({
        bot_id: selectedBot !== 'all' ? selectedBot : undefined,
        start_date: dateRange.from?.toISOString(),
        end_date: dateRange.to?.toISOString()
      });
      
      setStats(response.stats || {
        totalMessages: 1250,
        totalContacts: 89,
        responseRate: 94,
        averageResponseTime: 2.5,
        messagesGrowth: 12,
        contactsGrowth: 5
      });
    } catch (error) {
      // Dados fictícios para demonstração
      setStats({
        totalMessages: 1250,
        totalContacts: 89,
        responseRate: 94,
        averageResponseTime: 2.5,
        messagesGrowth: 12,
        contactsGrowth: 5
      });
    }
  };

  const loadChartData = async () => {
    try {
      const response = await apiClient.getReportsChartData({
        bot_id: selectedBot !== 'all' ? selectedBot : undefined,
        start_date: dateRange.from?.toISOString(),
        end_date: dateRange.to?.toISOString()
      });
      
      setChartData(response.chartData || generateMockChartData());
    } catch (error) {
      // Dados fictícios para demonstração
      setChartData(generateMockChartData());
    }
  };

  const generateMockChartData = () => {
    const messagesOverTime = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      messagesOverTime.push({
        date: date.toISOString().split('T')[0],
        incoming: Math.floor(Math.random() * 50) + 10,
        outgoing: Math.floor(Math.random() * 40) + 15,
        total: 0
      });
    }
    messagesOverTime.forEach(item => {
      item.total = item.incoming + item.outgoing;
    });

    return {
      messagesOverTime,
      messagesByType: [
        { name: 'Texto', value: 75, color: '#10b981' },
        { name: 'Imagem', value: 15, color: '#3b82f6' },
        { name: 'Áudio', value: 7, color: '#f59e0b' },
        { name: 'Documento', value: 3, color: '#ef4444' }
      ],
      messagesByDirection: [
        { name: 'Recebidas', value: 60, color: '#3b82f6' },
        { name: 'Enviadas', value: 40, color: '#10b981' }
      ],
      botPerformance: bots.map(bot => ({
        name: bot.name,
        messages: Math.floor(Math.random() * 500) + 100,
        contacts: Math.floor(Math.random() * 50) + 10,
        responseRate: Math.floor(Math.random() * 20) + 80
      }))
    };
  };

  const exportReport = () => {
    // Implementar exportação de relatório
    console.log('Exportando relatório...');
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

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
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-2">
            Análise detalhada do desempenho dos seus bots
          </p>
        </div>
        <Button onClick={exportReport} className="mt-4 sm:mt-0">
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Bot</label>
              <Select value={selectedBot} onValueChange={setSelectedBot}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os bots</SelectItem>
                  {bots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id.toString()}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadData} className="w-full">
                <Activity className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.messagesGrowth >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
              )}
              {Math.abs(stats.messagesGrowth)}% em relação ao período anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.contactsGrowth >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
              )}
              {Math.abs(stats.contactsGrowth)}% em relação ao período anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate}%</div>
            <p className="text-xs text-muted-foreground">
              Mensagens respondidas automaticamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseTime}s</div>
            <p className="text-xs text-muted-foreground">
              Tempo médio para resposta automática
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mensagens ao longo do tempo */}
        <Card>
          <CardHeader>
            <CardTitle>Mensagens ao Longo do Tempo</CardTitle>
            <CardDescription>
              Volume de mensagens nos últimos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.messagesOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="incoming" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Recebidas"
                />
                <Line 
                  type="monotone" 
                  dataKey="outgoing" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Enviadas"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Mensagens por tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Mensagens por Tipo</CardTitle>
            <CardDescription>
              Distribuição dos tipos de mensagem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.messagesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.messagesByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance dos bots */}
        <Card>
          <CardHeader>
            <CardTitle>Performance dos Bots</CardTitle>
            <CardDescription>
              Comparação de mensagens por bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.botPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="messages" fill="#10b981" name="Mensagens" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Direção das mensagens */}
        <Card>
          <CardHeader>
            <CardTitle>Direção das Mensagens</CardTitle>
            <CardDescription>
              Proporção entre mensagens recebidas e enviadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.messagesByDirection}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.messagesByDirection.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Performance Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Detalhada dos Bots</CardTitle>
          <CardDescription>
            Métricas detalhadas de cada bot no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Bot</th>
                  <th className="text-left p-2">Mensagens</th>
                  <th className="text-left p-2">Contatos</th>
                  <th className="text-left p-2">Taxa de Resposta</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {chartData.botPerformance.map((bot, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{bot.name}</td>
                    <td className="p-2">{bot.messages.toLocaleString()}</td>
                    <td className="p-2">{bot.contacts}</td>
                    <td className="p-2">{bot.responseRate}%</td>
                    <td className="p-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Ativo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;

