import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

const ConditionNode = ({ data, isConnectable }) => {
  const truncateText = (text, maxLength = 40) => {
    if (!text) return 'Sem condição definida';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Card className="min-w-[200px] max-w-[300px] shadow-lg border-2 border-blue-200 bg-blue-50">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
      
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm text-blue-800">
              {data.label || 'Condição'}
            </span>
          </div>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-blue-100"
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
          {truncateText(data.condition)}
        </div>
        
        <div className="mt-2 text-xs text-blue-600 font-medium">
          Ramificação condicional
        </div>
      </CardContent>
      
      {/* Handle para "Sim" (direita) */}
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500"
        style={{ top: '70%' }}
      />
      
      {/* Handle para "Não" (esquerda) */}
      <Handle
        type="source"
        position={Position.Left}
        id="no"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-red-500"
        style={{ top: '70%' }}
      />
      
      {/* Labels para os handles */}
      <div className="absolute -right-8 top-[65%] text-xs text-green-600 font-medium">
        Sim
      </div>
      <div className="absolute -left-8 top-[65%] text-xs text-red-600 font-medium">
        Não
      </div>
    </Card>
  );
};

export default ConditionNode;

