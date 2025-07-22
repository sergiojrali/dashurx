import React from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Edit, Trash2, Webhook, UserX, StopCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

const ActionNode = ({ data, isConnectable }) => {
  const getActionIcon = (action) => {
    switch (action) {
      case 'webhook':
        return <Webhook className="w-4 h-4" />;
      case 'transfer':
        return <UserX className="w-4 h-4" />;
      case 'end':
        return <StopCircle className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'webhook':
        return 'Chamar Webhook';
      case 'transfer':
        return 'Transferir para Humano';
      case 'end':
        return 'Finalizar Conversa';
      default:
        return 'Ação não definida';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'webhook':
        return 'purple';
      case 'transfer':
        return 'orange';
      case 'end':
        return 'red';
      default:
        return 'gray';
    }
  };

  const color = getActionColor(data.action);
  const borderColor = `border-${color}-200`;
  const bgColor = `bg-${color}-50`;
  const textColor = `text-${color}-800`;
  const iconColor = `text-${color}-600`;

  return (
    <Card className={`min-w-[200px] max-w-[280px] shadow-lg border-2 ${borderColor} ${bgColor}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className={`w-3 h-3 bg-${color}-500`}
      />
      
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className={iconColor}>
              {getActionIcon(data.action)}
            </span>
            <span className={`font-medium text-sm ${textColor}`}>
              {data.label || 'Ação'}
            </span>
          </div>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className={`h-6 w-6 p-0 hover:bg-${color}-100`}
              onClick={data.onEdit}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
              onClick={data.onDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 bg-white p-2 rounded border">
          {getActionLabel(data.action)}
        </div>
        
        <div className={`mt-2 text-xs ${iconColor} font-medium`}>
          Executar ação
        </div>
      </CardContent>
      
      {/* Handle de saída apenas se não for ação de finalizar */}
      {data.action !== 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className={`w-3 h-3 bg-${color}-500`}
        />
      )}
    </Card>
  );
};

export default ActionNode;

