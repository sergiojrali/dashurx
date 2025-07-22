import React from 'react';
import { Handle, Position } from 'reactflow';
import { Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

const DelayNode = ({ data, isConnectable }) => {
  const formatDelay = (delay) => {
    if (!delay) return '1s';
    const seconds = delay / 1000;
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  return (
    <Card className="min-w-[180px] max-w-[250px] shadow-lg border-2 border-yellow-200 bg-yellow-50">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-yellow-500"
      />
      
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-sm text-yellow-800">
              {data.label || 'Delay'}
            </span>
          </div>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-yellow-100"
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
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {formatDelay(data.delay)}
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            Aguardar antes de continuar
          </div>
        </div>
      </CardContent>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-yellow-500"
      />
    </Card>
  );
};

export default DelayNode;

