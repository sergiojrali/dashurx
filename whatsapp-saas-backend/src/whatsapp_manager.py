import os
import sys
import json
import threading
import time
import requests
from datetime import datetime
from typing import Dict, Optional
import subprocess
import signal

class WhatsAppManager:
    """Gerenciador de instâncias de bots do WhatsApp"""
    
    def __init__(self):
        self.instances: Dict[int, Dict] = {}  # bot_id -> instance_data
        self.base_port = int(os.getenv('WHATSAPP_BASE_PORT', 8000))
        self.whatsapp_module_path = os.path.join(
            os.path.dirname(__file__), 
            'whatsapp_module'
        )
        
    def create_instance(self, bot_id: int, bot_data: dict) -> bool:
        """Cria uma nova instância do bot"""
        try:
            if bot_id in self.instances:
                self.stop_instance(bot_id)
            
            port = self.base_port + bot_id
            
            # Criar diretório de sessões se não existir
            sessions_dir = os.path.join(self.whatsapp_module_path, 'sessions')
            os.makedirs(sessions_dir, exist_ok=True)
            
            # Configurar argumentos para o bot
            bot_script = os.path.join(self.whatsapp_module_path, 'whatsapp_bot.js')
            webhook_url = bot_data.get('webhook_url', '')
            
            # Iniciar o processo do bot
            process = subprocess.Popen([
                'node', bot_script, str(bot_id), str(port), webhook_url
            ], cwd=self.whatsapp_module_path,
               stdout=subprocess.PIPE, 
               stderr=subprocess.PIPE,
               env={**os.environ, 'PORT': str(port)})
            
            self.instances[bot_id] = {
                'process': process,
                'port': port,
                'status': 'starting',
                'created_at': datetime.utcnow(),
                'bot_data': bot_data,
                'qr_code': None
            }
            
            # Aguardar um pouco para o processo inicializar
            time.sleep(3)
            
            # Verificar se o processo ainda está rodando
            if process.poll() is not None:
                # Processo falhou
                stderr_output = process.stderr.read().decode('utf-8')
                print(f"Erro ao iniciar bot {bot_id}: {stderr_output}")
                return False
            
            # Monitorar o processo em thread separada
            threading.Thread(
                target=self._monitor_instance, 
                args=(bot_id,), 
                daemon=True
            ).start()
            
            return True
            
        except Exception as e:
            print(f"Erro ao criar instância do bot {bot_id}: {e}")
            return False
    
    def stop_instance(self, bot_id: int) -> bool:
        """Para uma instância do bot"""
        try:
            if bot_id not in self.instances:
                return False
            
            instance = self.instances[bot_id]
            process = instance['process']
            
            # Tentar parar graciosamente
            process.terminate()
            
            # Aguardar até 10 segundos
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                # Forçar parada
                process.kill()
                process.wait()
            
            del self.instances[bot_id]
            return True
            
        except Exception as e:
            print(f"Erro ao parar instância do bot {bot_id}: {e}")
            return False
    
    def get_instance_status(self, bot_id: int) -> Optional[dict]:
        """Retorna o status de uma instância"""
        if bot_id not in self.instances:
            return None
        
        instance = self.instances[bot_id]
        process = instance['process']
        
        if process.poll() is not None:
            return {'status': 'stopped', 'message': 'Processo parado'}
        
        # Tentar obter status via API
        try:
            port = instance['port']
            response = requests.get(f'http://localhost:{port}/status', timeout=5)
            if response.status_code == 200:
                status_data = response.json()
                instance['status'] = status_data.get('status', 'unknown')
                instance['qr_code'] = status_data.get('qrCode')
                return status_data
        except requests.RequestException:
            pass
        
        return {
            'status': instance['status'],
            'qrCode': instance.get('qr_code')
        }
    
    def get_instance_qr(self, bot_id: int) -> Optional[str]:
        """Retorna o QR code de uma instância"""
        if bot_id not in self.instances:
            return None
            
        try:
            port = self.instances[bot_id]['port']
            response = requests.get(f'http://localhost:{port}/qr', timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('status'):
                    return data.get('qrCode')
        except requests.RequestException:
            pass
        
        return None
    
    def send_message(self, bot_id: int, number: str, message: str) -> bool:
        """Envia mensagem através de uma instância"""
        try:
            if bot_id not in self.instances:
                return False
            
            port = self.instances[bot_id]['port']
            
            response = requests.post(f'http://localhost:{port}/send-message', json={
                'number': number,
                'message': message
            }, timeout=30)
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Erro ao enviar mensagem pelo bot {bot_id}: {e}")
            return False
    
    def send_media(self, bot_id: int, number: str, media_url: str, caption: str = '') -> bool:
        """Envia mídia através de uma instância"""
        try:
            if bot_id not in self.instances:
                return False
            
            port = self.instances[bot_id]['port']
            
            response = requests.post(f'http://localhost:{port}/send-media', json={
                'number': number,
                'mediaUrl': media_url,
                'caption': caption
            }, timeout=30)
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Erro ao enviar mídia pelo bot {bot_id}: {e}")
            return False
    
    def _monitor_instance(self, bot_id: int):
        """Monitora uma instância do bot"""
        while bot_id in self.instances:
            try:
                instance = self.instances[bot_id]
                process = instance['process']
                
                # Verificar se o processo ainda está rodando
                if process.poll() is not None:
                    # Processo parou
                    instance['status'] = 'stopped'
                    print(f"Bot {bot_id} parou inesperadamente")
                    break
                
                # Verificar status via API
                status_data = self.get_instance_status(bot_id)
                if status_data:
                    instance['status'] = status_data.get('status', 'unknown')
                    instance['qr_code'] = status_data.get('qrCode')
                
                time.sleep(5)  # Verificar a cada 5 segundos
                
            except Exception as e:
                print(f"Erro no monitoramento do bot {bot_id}: {e}")
                break
    
    def cleanup_all(self):
        """Para todas as instâncias"""
        bot_ids = list(self.instances.keys())
        for bot_id in bot_ids:
            self.stop_instance(bot_id)

# Instância global do gerenciador
whatsapp_manager = WhatsAppManager()

