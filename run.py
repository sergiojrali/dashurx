import os
import sys
import subprocess
import time
import platform
import threading
import signal
import webbrowser
from pathlib import Path

class Colors:
    """Cores para output no terminal"""
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

class WhatsAppSaaSLauncher:
    def __init__(self):
        self.is_windows = platform.system() == "Windows"
        self.project_root = Path(__file__).parent
        self.backend_dir = self.project_root / "whatsapp-saas-backend"
        self.frontend_dir = self.project_root / "whatsapp-saas-frontend"
        self.processes = []
        
    def print_colored(self, message, color=Colors.END):
        """Imprime mensagem colorida"""
        print(f"{color}{message}{Colors.END}")
        
    def print_header(self):
        """Imprime cabeçalho do script"""
        self.print_colored("=" * 60, Colors.BLUE)
        self.print_colored("🚀 WhatsApp SaaS - Inicializador Automático", Colors.BOLD)
        self.print_colored("=" * 60, Colors.BLUE)
        print()
        
    def check_requirements(self):
        """Verifica se os requisitos estão instalados"""
        self.print_colored("🔍 Verificando requisitos...", Colors.YELLOW)
        
        # Verificar Python
        try:
            python_version = sys.version_info
            if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
                self.print_colored("❌ Python 3.8+ é necessário", Colors.RED)
                return False
            self.print_colored(f"✅ Python {python_version.major}.{python_version.minor} encontrado", Colors.GREEN)
        except Exception as e:
            self.print_colored(f"❌ Erro ao verificar Python: {e}", Colors.RED)
            return False
            
        # Verificar Node.js
        try:
            result = subprocess.run(["node", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                node_version = result.stdout.strip()
                self.print_colored(f"✅ Node.js {node_version} encontrado", Colors.GREEN)
            else:
                self.print_colored("❌ Node.js não encontrado. Instale Node.js 18+", Colors.RED)
                return False
        except FileNotFoundError:
            self.print_colored("❌ Node.js não encontrado. Instale Node.js 18+", Colors.RED)
            return False
            
        # Verificar npm
        try:
            result = subprocess.run("npm --version", capture_output=True, text=True, shell=True)
            if result.returncode == 0:
                npm_version = result.stdout.strip()
                self.print_colored(f"✅ npm {npm_version} encontrado", Colors.GREEN)
            else:
                self.print_colored("❌ npm não encontrado", Colors.RED)
                return False
        except FileNotFoundError:
            self.print_colored("❌ npm não encontrado", Colors.RED)
            return False
            
        # Verificar estrutura do projeto
        if not self.backend_dir.exists():
            self.print_colored("❌ Diretório do backend não encontrado", Colors.RED)
            return False
            
        if not self.frontend_dir.exists():
            self.print_colored("❌ Diretório do frontend não encontrado", Colors.RED)
            return False
            
        self.print_colored("✅ Todos os requisitos verificados!", Colors.GREEN)
        print()
        return True
        
    def setup_backend(self):
        """Configura o ambiente do backend"""
        self.print_colored("🔧 Configurando backend...", Colors.YELLOW)
        
        os.chdir(self.backend_dir)
        
        # Verificar se o ambiente virtual existe
        venv_path = self.backend_dir / "venv"
        if not venv_path.exists():
            self.print_colored("📦 Criando ambiente virtual Python...", Colors.BLUE)
            subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
            
        # Ativar ambiente virtual e instalar dependências
        if self.is_windows:
            pip_cmd = str(venv_path / "Scripts" / "pip.exe")
            python_cmd = str(venv_path / "Scripts" / "python.exe")
        else:
            pip_cmd = str(venv_path / "bin" / "pip")
            python_cmd = str(venv_path / "bin" / "python")
            
        # Verificar se requirements.txt existe
        requirements_file = self.backend_dir / "requirements.txt"
        if requirements_file.exists():
            self.print_colored("📦 Instalando dependências Python...", Colors.BLUE)
            subprocess.run([pip_cmd, "install", "-r", "requirements.txt"], check=True)
        else:
            self.print_colored("⚠️  requirements.txt não encontrado, instalando dependências básicas...", Colors.YELLOW)
            basic_deps = [
                "flask", "flask-cors", "flask-jwt-extended", 
                "sqlalchemy", "flask-sqlalchemy", "bcrypt"
            ]
            subprocess.run([pip_cmd, "install"] + basic_deps, check=True)
            
        self.print_colored("✅ Backend configurado!", Colors.GREEN)
        return python_cmd
        
    def setup_frontend(self):
        """Configura o ambiente do frontend"""
        self.print_colored("🔧 Configurando frontend...", Colors.YELLOW)
        
        os.chdir(self.frontend_dir)
        
        # Verificar se node_modules existe
        node_modules_path = self.frontend_dir / "node_modules"
        package_json_path = self.frontend_dir / "package.json"
        
        if package_json_path.exists() and not node_modules_path.exists():
            self.print_colored("📦 Instalando dependências Node.js...", Colors.BLUE)
            subprocess.run("npm install --legacy-peer-deps", check=True, shell=True)
        elif not package_json_path.exists():
            self.print_colored("⚠️  package.json não encontrado no frontend", Colors.YELLOW)
            
        self.print_colored("✅ Frontend configurado!", Colors.GREEN)
        
    def start_backend(self, python_cmd):
        """Inicia o servidor backend"""
        self.print_colored("🚀 Iniciando servidor backend...", Colors.BLUE)
        
        os.chdir(self.backend_dir)
        
        # Definir variáveis de ambiente
        env = os.environ.copy()
        env["FLASK_ENV"] = "development"
        env["FLASK_DEBUG"] = "1"
        
        # Iniciar servidor Flask
        main_file = self.backend_dir / "src" / "main.py"
        if main_file.exists():
            cmd = [python_cmd, str(main_file)]
        else:
            self.print_colored("❌ Arquivo main.py não encontrado", Colors.RED)
            return None
            
        process = subprocess.Popen(
            cmd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        self.processes.append(("Backend", process))
        
        # Thread para monitorar output do backend
        def monitor_backend():
            for line in iter(process.stdout.readline, ''):
                if line:
                    print(f"[BACKEND] {line.rstrip()}")
                    
        threading.Thread(target=monitor_backend, daemon=True).start()
        
        # Aguardar o backend inicializar
        self.print_colored("⏳ Aguardando backend inicializar...", Colors.YELLOW)
        time.sleep(5)
        
        return process
        
    def start_frontend(self):
        """Inicia o servidor frontend"""
        self.print_colored("🚀 Iniciando servidor frontend...", Colors.BLUE)
        
        os.chdir(self.frontend_dir)
        
        # Verificar se existe script de dev
        package_json_path = self.frontend_dir / "package.json"
        if not package_json_path.exists():
            self.print_colored("❌ package.json não encontrado no frontend", Colors.RED)
            return None
            
        # Iniciar servidor de desenvolvimento
        process = subprocess.Popen(
            "npm run dev",
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        self.processes.append(("Frontend", process))
        
        # Thread para monitorar output do frontend
        def monitor_frontend():
            for line in iter(process.stdout.readline, ''):
                if line:
                    print(f"[FRONTEND] {line.rstrip()}")
                    
        threading.Thread(target=monitor_frontend, daemon=True).start()
        
        # Aguardar o frontend inicializar
        self.print_colored("⏳ Aguardando frontend inicializar...", Colors.YELLOW)
        time.sleep(8)
        
        return process
        
    def open_browser(self):
        """Abre o navegador com a aplicação"""
        self.print_colored("🌐 Abrindo navegador...", Colors.BLUE)
        try:
            webbrowser.open("http://localhost:3000")
            self.print_colored("✅ Navegador aberto!", Colors.GREEN)
        except Exception as e:
            self.print_colored(f"⚠️  Não foi possível abrir o navegador: {e}", Colors.YELLOW)
            self.print_colored("📱 Acesse manualmente: http://localhost:3000", Colors.BLUE)
            
    def print_status(self):
        """Imprime status dos serviços"""
        print()
        self.print_colored("=" * 60, Colors.GREEN)
        self.print_colored("🎉 WhatsApp SaaS iniciado com sucesso!", Colors.BOLD)
        self.print_colored("=" * 60, Colors.GREEN)
        print()
        self.print_colored("📊 Status dos Serviços:", Colors.BOLD)
        self.print_colored("  🔧 Backend:  http://localhost:5000", Colors.BLUE)
        self.print_colored("  🌐 Frontend: http://localhost:3000", Colors.BLUE)
        print()
        self.print_colored("🔑 Credenciais padrão:", Colors.BOLD)
        self.print_colored("  👤 Usuário: admin", Colors.BLUE)
        self.print_colored("  🔒 Senha:   admin123", Colors.BLUE)
        print()
        self.print_colored("⚡ Comandos úteis:", Colors.BOLD)
        self.print_colored("  Ctrl+C: Parar todos os serviços", Colors.YELLOW)
        print()
        
    def cleanup(self):
        """Limpa processos ao sair"""
        self.print_colored("\n🛑 Parando serviços...", Colors.YELLOW)
        
        for name, process in self.processes:
            try:
                self.print_colored(f"  Parando {name}...", Colors.BLUE)
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.print_colored(f"  Forçando parada do {name}...", Colors.RED)
                process.kill()
            except Exception as e:
                self.print_colored(f"  Erro ao parar {name}: {e}", Colors.RED)
                
        self.print_colored("✅ Todos os serviços foram parados!", Colors.GREEN)
        
    def run(self):
        """Executa o launcher"""
        try:
            # Salvar diretório original
            original_dir = os.getcwd()
            
            self.print_header()
            
            # Verificar requisitos
            if not self.check_requirements():
                self.print_colored("❌ Falha na verificação de requisitos", Colors.RED)
                return 1
                
            # Configurar backend
            python_cmd = self.setup_backend()
            
            # Configurar frontend
            self.setup_frontend()
            
            # Voltar ao diretório original
            os.chdir(original_dir)
            
            # Iniciar serviços
            backend_process = self.start_backend(python_cmd)
            if not backend_process:
                return 1
                
            frontend_process = self.start_frontend()
            if not frontend_process:
                return 1
                
            # Abrir navegador
            self.open_browser()
            
            # Mostrar status
            self.print_status()
            
            # Aguardar interrupção
            try:
                while True:
                    time.sleep(1)
                    # Verificar se algum processo morreu
                    for name, process in self.processes:
                        if process.poll() is not None:
                            self.print_colored(f"⚠️  {name} parou inesperadamente", Colors.RED)
                            
            except KeyboardInterrupt:
                pass
                
        except Exception as e:
            self.print_colored(f"❌ Erro durante execução: {e}", Colors.RED)
            return 1
        finally:
            self.cleanup()
            
        return 0

def signal_handler(signum, frame):
    """Handler para sinais do sistema"""
    print("\n🛑 Recebido sinal de interrupção...")
    sys.exit(0)

if __name__ == "__main__":
    # Configurar handler para Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)
    if hasattr(signal, 'SIGTERM'):
        signal.signal(signal.SIGTERM, signal_handler)
    
    launcher = WhatsAppSaaSLauncher()
    exit_code = launcher.run()
    sys.exit(exit_code)
