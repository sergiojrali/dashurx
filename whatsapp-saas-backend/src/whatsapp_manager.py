import os
import sys
import json
import threading
import time
from datetime import datetime
from typing import Dict, Optional
import subprocess
import signal

class WhatsAppManager:
    """Gerenciador de instâncias de bots do WhatsApp"""
    
    def __init__(self):
        self.instances: Dict[int, Dict] = {}  # bot_id -> instance_data
        self.base_port = 8000
        self.bot_zdg_path = "/home/ubuntu/bot-zdg"
        
    def create_instance(self, bot_id: int, bot_data: dict) -> bool:
        """Cria uma nova instância do bot"""
        try:
            if bot_id in self.instances:
                self.stop_instance(bot_id)
            
            port = self.base_port + bot_id
            instance_dir = f"/tmp/bot_instance_{bot_id}"
            
            # Criar diretório da instância
            os.makedirs(instance_dir, exist_ok=True)
            
            # Copiar arquivos do bot base
            subprocess.run([
                'cp', '-r', f"{self.bot_zdg_path}/.", instance_dir
            ], check=True)
            
            # Modificar o arquivo app.js para esta instância
            self._customize_bot_instance(instance_dir, bot_id, bot_data, port)
            
            # Instalar dependências
            subprocess.run([
                'npm', 'install'
            ], cwd=instance_dir, check=True)
            
            # Iniciar o processo do bot
            process = subprocess.Popen([
                'node', 'app.js'
            ], cwd=instance_dir, 
               stdout=subprocess.PIPE, 
               stderr=subprocess.PIPE,
               env={**os.environ, 'PORT': str(port)})
            
            self.instances[bot_id] = {
                'process': process,
                'port': port,
                'instance_dir': instance_dir,
                'status': 'starting',
                'created_at': datetime.utcnow(),
                'bot_data': bot_data
            }
            
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
            
            # Limpar diretório da instância
            instance_dir = instance['instance_dir']
            if os.path.exists(instance_dir):
                subprocess.run(['rm', '-rf', instance_dir])
            
            del self.instances[bot_id]
            return True
            
        except Exception as e:
            print(f"Erro ao parar instância do bot {bot_id}: {e}")
            return False
    
    def get_instance_status(self, bot_id: int) -> Optional[str]:
        """Retorna o status de uma instância"""
        if bot_id not in self.instances:
            return None
        
        instance = self.instances[bot_id]
        process = instance['process']
        
        if process.poll() is None:
            return instance['status']
        else:
            return 'stopped'
    
    def get_instance_qr(self, bot_id: int) -> Optional[str]:
        """Retorna o QR code de uma instância"""
        # Implementar lógica para capturar QR code
        # Por enquanto retorna None
        return None
    
    def send_message(self, bot_id: int, number: str, message: str) -> bool:
        """Envia mensagem através de uma instância"""
        try:
            if bot_id not in self.instances:
                return False
            
            instance = self.instances[bot_id]
            port = instance['port']
            
            # Fazer requisição HTTP para a API do bot
            import requests
            
            response = requests.post(f'http://localhost:{port}/zdg-message', json={
                'number': number,
                'message': message
            }, timeout=30)
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Erro ao enviar mensagem pelo bot {bot_id}: {e}")
            return False
    
    def send_media(self, bot_id: int, number: str, file_url: str, caption: str = '') -> bool:
        """Envia mídia através de uma instância"""
        try:
            if bot_id not in self.instances:
                return False
            
            instance = self.instances[bot_id]
            port = instance['port']
            
            # Fazer requisição HTTP para a API do bot
            import requests
            
            response = requests.post(f'http://localhost:{port}/zdg-media', json={
                'number': number,
                'file': file_url,
                'caption': caption
            }, timeout=30)
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Erro ao enviar mídia pelo bot {bot_id}: {e}")
            return False
    
    def _customize_bot_instance(self, instance_dir: str, bot_id: int, bot_data: dict, port: int):
        """Customiza a instância do bot com configurações específicas"""
        app_js_path = os.path.join(instance_dir, 'app.js')
        
        # Ler o arquivo app.js original
        with open(app_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Modificar configurações
        content = content.replace(
            "const port = process.env.PORT || 8000;",
            f"const port = process.env.PORT || {port};"
        )
        
        # Modificar clientId para ser único
        content = content.replace(
            "authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),",
            f"authStrategy: new LocalAuth({{ clientId: 'bot-{bot_id}' }}),"
        )
        
        # Adicionar webhook se configurado
        if bot_data.get('webhook_url'):
            webhook_code = f"""
// Webhook para bot {bot_id}
const webhookUrl = '{bot_data['webhook_url']}';

client.on('message', async msg => {{
    if (webhookUrl) {{
        try {{
            await axios.post(webhookUrl, {{
                bot_id: {bot_id},
                message: {{
                    from: msg.from,
                    body: msg.body,
                    type: msg.type,
                    timestamp: new Date().toISOString()
                }}
            }});
        }} catch (error) {{
            console.log('Erro ao enviar webhook:', error.message);
        }}
    }}
}});
"""
            content = content.replace(
                "client.on('message', async msg => {",
                webhook_code + "\n\nclient.on('message', async msg => {"
            )
        
        # Salvar arquivo modificado
        with open(app_js_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
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
                    break
                
                # Verificar se está conectado (implementar lógica específica)
                # Por enquanto, apenas marca como ativo após 30 segundos
                if instance['status'] == 'starting':
                    elapsed = (datetime.utcnow() - instance['created_at']).seconds
                    if elapsed > 30:
                        instance['status'] = 'active'
                
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

