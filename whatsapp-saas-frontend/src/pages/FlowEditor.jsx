import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useAuth } from '../hooks/useAuth.jsx';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Save,
  Play,
  Pause,
  Plus,
  Trash2,
  Settings,
  MessageSquare,
  GitBranch,
  Clock,
  Image,
  FileText,
  Mic,
  Video,
  ArrowLeft,
  Download,
  Upload
} from 'lucide-react';

// Componentes de nós customizados
import MessageNode from '../components/flow/MessageNode';
import ConditionNode from '../components/flow/ConditionNode';
import DelayNode from '../components/flow/DelayNode';
import ActionNode from '../components/flow/ActionNode';

const nodeTypes = {
  messageNode: MessageNode,
  conditionNode: ConditionNode,
  delayNode: DelayNode,
  actionNode: ActionNode,
};

const FlowEditor = () => {
  const { botId, flowId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bot, setBot] = useState(null);
  const [flow, setFlow] = useState(null);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState('');
  const [nodeFormData, setNodeFormData] = useState({});
  const [editingNode, setEditingNode] = useState(null);

  const nodeTypeOptions = [
    { value: 'messageNode', label: 'Mensagem', icon: MessageSquare, description: 'Enviar uma mensagem de texto, imagem, áudio ou vídeo' },
    { value: 'conditionNode', label: 'Condição', icon: GitBranch, description: 'Criar ramificações baseadas em condições' },
    { value: 'delayNode', label: 'Delay', icon: Clock, description: 'Aguardar um tempo antes de continuar' },
    { value: 'actionNode', label: 'Ação', icon: Settings, description: 'Executar uma ação específica' },
  ];

  useEffect(() => {
    loadData();
  }, [botId, flowId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar bot
      const botResponse = await apiClient.getBot(botId);
      setBot(botResponse.bot);
      
      if (flowId && flowId !== 'new') {
        // Carregar fluxo existente
        const flowResponse = await apiClient.getFlow(flowId);
        setFlow(flowResponse.flow);
        
        // Carregar nós e conexões
        const nodesResponse = await apiClient.getFlowNodes(flowId);
        
        // Converter nós do backend para o formato do ReactFlow
        const flowNodes = nodesResponse.nodes.map(node => ({
          id: node.id.toString(),
          type: node.node_type,
          position: { x: node.position_x, y: node.position_y },
          data: {
            ...node.node_data,
            label: node.node_data.label || getNodeTypeLabel(node.node_type),
            onEdit: () => handleEditNode(node),
            onDelete: () => handleDeleteNode(node.id),
          },
        }));
        
        // Converter conexões do backend para o formato do ReactFlow
        const flowEdges = nodesResponse.connections.map(connection => ({
          id: connection.id.toString(),
          source: connection.from_node_id.toString(),
          target: connection.to_node_id.toString(),
          type: 'smoothstep',
          animated: true,
          label: connection.condition_value || '',
        }));
        
        setNodes(flowNodes);
        setEdges(flowEdges);
      } else {
        // Novo fluxo
        setFlow({
          name: 'Novo Fluxo',
          description: '',
          trigger_type: 'message',
          trigger_value: '',
          is_active: true
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados do fluxo');
    } finally {
      setLoading(false);
    }
  };

  const getNodeTypeLabel = (nodeType) => {
    const option = nodeTypeOptions.find(opt => opt.value === nodeType);
    return option ? option.label : nodeType;
  };

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        id: `edge-${params.source}-${params.target}`,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const handleAddNode = (nodeType) => {
    setSelectedNodeType(nodeType);
    setNodeFormData({
      label: getNodeTypeLabel(nodeType),
      message: '',
      messageType: 'text',
      condition: '',
      delay: 1000,
      action: '',
    });
    setEditingNode(null);
    setIsNodeDialogOpen(true);
  };

  const handleEditNode = (node) => {
    setSelectedNodeType(node.node_type);
    setNodeFormData(node.node_data);
    setEditingNode(node);
    setIsNodeDialogOpen(true);
  };

  const handleSaveNode = async () => {
    try {
      const nodeData = {
        node_type: selectedNodeType,
        node_data: nodeFormData,
        position_x: editingNode ? editingNode.position_x : Math.random() * 400 + 100,
        position_y: editingNode ? editingNode.position_y : Math.random() * 400 + 100,
        order_index: nodes.length,
      };

      if (editingNode) {
        // Atualizar nó existente
        await apiClient.updateFlowNode(flowId, editingNode.id, nodeData);
        
        setNodes((nds) =>
          nds.map((node) =>
            node.id === editingNode.id.toString()
              ? {
                  ...node,
                  data: {
                    ...nodeFormData,
                    onEdit: () => handleEditNode({ ...editingNode, node_data: nodeFormData }),
                    onDelete: () => handleDeleteNode(editingNode.id),
                  },
                }
              : node
          )
        );
      } else {
        // Criar novo nó
        const response = await apiClient.createFlowNode(flowId, nodeData);
        const newNode = response.node;
        
        const flowNode = {
          id: newNode.id.toString(),
          type: selectedNodeType,
          position: { x: nodeData.position_x, y: nodeData.position_y },
          data: {
            ...nodeFormData,
            onEdit: () => handleEditNode(newNode),
            onDelete: () => handleDeleteNode(newNode.id),
          },
        };
        
        setNodes((nds) => nds.concat(flowNode));
      }
      
      setIsNodeDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar nó:', error);
      setError('Erro ao salvar nó');
    }
  };

  const handleDeleteNode = async (nodeId) => {
    if (!confirm('Tem certeza que deseja excluir este nó?')) return;
    
    try {
      await apiClient.deleteFlowNode(flowId, nodeId);
      
      setNodes((nds) => nds.filter((node) => node.id !== nodeId.toString()));
      setEdges((eds) => eds.filter((edge) => 
        edge.source !== nodeId.toString() && edge.target !== nodeId.toString()
      ));
    } catch (error) {
      console.error('Erro ao excluir nó:', error);
      setError('Erro ao excluir nó');
    }
  };

  const handleSaveFlow = async () => {
    try {
      setSaving(true);
      
      if (flowId === 'new') {
        // Criar novo fluxo
        const flowData = {
          ...flow,
          bot_id: parseInt(botId),
        };
        const response = await apiClient.createFlow(botId, flowData);
        const newFlowId = response.flow.id;
        
        // Redirecionar para o editor do novo fluxo
        navigate(`/bots/${botId}/flows/${newFlowId}`);
      } else {
        // Atualizar fluxo existente
        await apiClient.updateFlow(flowId, flow);
        
        // Salvar posições dos nós
        for (const node of nodes) {
          await apiClient.updateFlowNode(flowId, parseInt(node.id), {
            position_x: node.position.x,
            position_y: node.position.y,
          });
        }
        
        // Salvar conexões (edges)
        // Primeiro, remover conexões antigas e criar novas
        // (implementação simplificada - em produção seria mais sofisticada)
      }
      
      setError('');
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
      setError('Erro ao salvar fluxo');
    } finally {
      setSaving(false);
    }
  };

  const proOptions = { hideAttribution: true };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/bots/${botId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                {flow?.name || 'Novo Fluxo'} - {bot?.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Editor visual de fluxos de conversa
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button
              onClick={handleSaveFlow}
              disabled={saving}
              className="whatsapp-gradient text-white"
            >
              {saving ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Flow Editor */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          proOptions={proOptions}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
          
          {/* Panel de ferramentas */}
          <Panel position="top-left">
            <Card className="w-64">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Adicionar Nó</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {nodeTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleAddNode(option.value)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {option.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </Panel>
        </ReactFlow>
      </div>

      {/* Dialog para criar/editar nó */}
      <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingNode ? 'Editar Nó' : 'Adicionar Nó'}
            </DialogTitle>
            <DialogDescription>
              Configure as propriedades do nó {getNodeTypeLabel(selectedNodeType)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="node-label">Rótulo</Label>
              <Input
                id="node-label"
                value={nodeFormData.label || ''}
                onChange={(e) => setNodeFormData({...nodeFormData, label: e.target.value})}
                placeholder="Nome do nó"
              />
            </div>

            {selectedNodeType === 'messageNode' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="message-type">Tipo de Mensagem</Label>
                  <Select
                    value={nodeFormData.messageType || 'text'}
                    onValueChange={(value) => setNodeFormData({...nodeFormData, messageType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="image">Imagem</SelectItem>
                      <SelectItem value="audio">Áudio</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="document">Documento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message-content">Conteúdo da Mensagem</Label>
                  <Textarea
                    id="message-content"
                    value={nodeFormData.message || ''}
                    onChange={(e) => setNodeFormData({...nodeFormData, message: e.target.value})}
                    placeholder="Digite a mensagem..."
                    rows={4}
                  />
                </div>
              </>
            )}

            {selectedNodeType === 'conditionNode' && (
              <div className="grid gap-2">
                <Label htmlFor="condition">Condição</Label>
                <Input
                  id="condition"
                  value={nodeFormData.condition || ''}
                  onChange={(e) => setNodeFormData({...nodeFormData, condition: e.target.value})}
                  placeholder="Ex: mensagem contém 'sim'"
                />
              </div>
            )}

            {selectedNodeType === 'delayNode' && (
              <div className="grid gap-2">
                <Label htmlFor="delay">Delay (milissegundos)</Label>
                <Input
                  id="delay"
                  type="number"
                  value={nodeFormData.delay || 1000}
                  onChange={(e) => setNodeFormData({...nodeFormData, delay: parseInt(e.target.value)})}
                  placeholder="1000"
                />
              </div>
            )}

            {selectedNodeType === 'actionNode' && (
              <div className="grid gap-2">
                <Label htmlFor="action">Ação</Label>
                <Select
                  value={nodeFormData.action || ''}
                  onValueChange={(value) => setNodeFormData({...nodeFormData, action: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webhook">Chamar Webhook</SelectItem>
                    <SelectItem value="transfer">Transferir para Humano</SelectItem>
                    <SelectItem value="end">Finalizar Conversa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNodeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNode} className="whatsapp-gradient text-white">
              {editingNode ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlowEditor;

