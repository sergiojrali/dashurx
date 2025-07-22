import React from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare, Edit, Trash2, Image, Video, Mic, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

const MessageNode = ({ data, isConnectable }) => {
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

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Card className="min-w-[200px] max-w-[300px] shadow-lg border-2 border-green-200 bg-green-50">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500"
      />
      
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getMessageTypeIcon(data.messageType)}
            <span className="font-medium text-sm text-green-800">
              {data.label || 'Mensagem'}
            </span>
          </div>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-green-100"
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
        
        {data.message && (
          <div className="text-xs text-gray-600 bg-white p-2 rounded border">
            {truncateText(data.message)}
          </div>
        )}
        
        <div className="mt-2 text-xs text-green-600 font-medium">
          {data.messageType === 'text' ? 'Texto' : 
           data.messageType === 'image' ? 'Imagem' :
           data.messageType === 'video' ? 'Vídeo' :
           data.messageType === 'audio' ? 'Áudio' : 'Documento'}
        </div>
      </CardContent>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500"
      />
    </Card>
  );
};

export default MessageNode;

