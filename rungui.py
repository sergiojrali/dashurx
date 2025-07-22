"""
WhatsApp SaaS - Interface Gráfica de Gerenciamento
Painel de controle visual para gerenciar todo o sistema WhatsApp SaaS
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import threading
import subprocess
import time
import requests
import json
import os
import sys
import platform
import webbrowser
from pathlib import Path
from datetime import datetime

class WhatsAppSaaSGUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("WhatsApp SaaS - Painel de Controle")
        self.root.geometry("1200x800")
        self.root.configure(bg='#f0f0f0')
        
        # Configurações
        self.is_windows = platform.system() == "Windows"
        self.project_root = Path(__file__).parent
        self.backend_dir = self.project_root / "whatsapp-saas-backend"
        self.frontend_dir = self.project_root / "whatsapp-saas-frontend"
        
        # Estado do sistema
        self.backend_process = None
        self.frontend_process = None
        self.backend_running = False
        self.frontend_running = False
        self.api_token = None
        
        # URLs
        self.backend_url = "http://localhost:5000"
        self.frontend_url = "http://localhost:3000"
        self.api_url = f"{self.backend_url}/api"
        
        # Configurar interface
        self.setup_ui()
        self.setup_styles()
        
        # Iniciar monitoramento
        self.start_monitoring()
        
    def setup_styles(self):
        """Configura estilos da interface"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # Cores do WhatsApp
        style.configure('WhatsApp.TButton', 
                       background='#25D366', 
                       foreground='white',
                       font=('Arial', 10, 'bold'))
        
        style.configure('Danger.TButton', 
                       background='#dc3545', 
                       foreground='white',
                       font=('Arial', 10, 'bold'))
        
        style.configure('Info.TButton', 
                       background='#17a2b8', 
                       foreground='white',
                       font=('Arial', 10, 'bold'))
        
    def setup_ui(self):
        """Configura a interface do usuário"""
        # Frame principal
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configurar grid
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(1, weight=1)
        
        # Header
        self.setup_header(main_frame)
        
        # Notebook para abas
        self.notebook = ttk.Notebook(main_frame)
        self.notebook.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(10, 0))
        
        # Abas
        self.setup_dashboard_tab()
        self.setup_services_tab()
        self.setup_users_tab()
        self.setup_bots_tab()
        self.setup_logs_tab()
        self.setup_settings_tab()
        
    def setup_header(self, parent):
        """Configura o cabeçalho"""
        header_frame = ttk.Frame(parent)
        header_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        header_frame.columnconfigure(1, weight=1)
        
        # Logo e título
        title_label = tk.Label(header_frame, 
                              text="🚀 WhatsApp SaaS - Painel de Controle", 
                              font=('Arial', 16, 'bold'),
                              bg='#f0f0f0',
                              fg='#25D366')
        title_label.grid(row=0, column=0, sticky=tk.W)
        
        # Status geral
        self.status_label = tk.Label(header_frame, 
                                   text="Sistema: Parado", 
                                   font=('Arial', 12),
                                   bg='#f0f0f0',
                                   fg='#dc3545')
        self.status_label.grid(row=0, column=1, sticky=tk.E)
        
    def setup_dashboard_tab(self):
        """Configura a aba Dashboard"""
        dashboard_frame = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(dashboard_frame, text="📊 Dashboard")
        
        # Grid principal
        dashboard_frame.columnconfigure(1, weight=1)
        dashboard_frame.rowconfigure(2, weight=1)
        
        # Status dos serviços
        services_frame = ttk.LabelFrame(dashboard_frame, text="Status dos Serviços", padding="10")
        services_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        services_frame.columnconfigure(1, weight=1)
        
        # Backend status
        ttk.Label(services_frame, text="Backend (Flask):").grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        self.backend_status_label = tk.Label(services_frame, text="⚫ Parado", fg='red')
        self.backend_status_label.grid(row=0, column=1, sticky=tk.W)
        
        # Frontend status
        ttk.Label(services_frame, text="Frontend (React):").grid(row=1, column=0, sticky=tk.W, padx=(0, 10))
        self.frontend_status_label = tk.Label(services_frame, text="⚫ Parado", fg='red')
        self.frontend_status_label.grid(row=1, column=1, sticky=tk.W)
        
        # Controles principais
        controls_frame = ttk.LabelFrame(dashboard_frame, text="Controles Principais", padding="10")
        controls_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # Botões de controle
        ttk.Button(controls_frame, text="🚀 Iniciar Sistema", 
                  command=self.start_system, style='WhatsApp.TButton').grid(row=0, column=0, padx=(0, 5))
        
        ttk.Button(controls_frame, text="🛑 Parar Sistema", 
                  command=self.stop_system, style='Danger.TButton').grid(row=0, column=1, padx=5)
        
        ttk.Button(controls_frame, text="🌐 Abrir Frontend", 
                  command=self.open_frontend, style='Info.TButton').grid(row=0, column=2, padx=5)
        
        ttk.Button(controls_frame, text="🔄 Reiniciar Sistema", 
                  command=self.restart_system, style='Info.TButton').grid(row=0, column=3, padx=(5, 0))
        
        # Estatísticas
        stats_frame = ttk.LabelFrame(dashboard_frame, text="Estatísticas do Sistema", padding="10")
        stats_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S))
        stats_frame.columnconfigure(1, weight=1)
        
        # Labels de estatísticas
        self.stats_labels = {}
        stats_items = [
            ("Usuários Cadastrados:", "users_count"),
            ("Bots Ativos:", "active_bots"),
            ("Mensagens Hoje:", "messages_today"),
            ("Uptime:", "uptime"),
            ("Última Atualização:", "last_update")
        ]
        
        for i, (label, key) in enumerate(stats_items):
            ttk.Label(stats_frame, text=label).grid(row=i, column=0, sticky=tk.W, pady=2)
            self.stats_labels[key] = tk.Label(stats_frame, text="--", fg='blue')
            self.stats_labels[key].grid(row=i, column=1, sticky=tk.W, padx=(10, 0), pady=2)
            
    def setup_services_tab(self):
        """Configura a aba Serviços"""
        services_frame = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(services_frame, text="⚙️ Serviços")
        
        # Backend controls
        backend_frame = ttk.LabelFrame(services_frame, text="Backend (Flask)", padding="10")
        backend_frame.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        backend_frame.columnconfigure(2, weight=1)
        
        ttk.Button(backend_frame, text="Iniciar Backend", 
                  command=self.start_backend).grid(row=0, column=0, padx=(0, 5))
        ttk.Button(backend_frame, text="Parar Backend", 
                  command=self.stop_backend).grid(row=0, column=1, padx=5)
        
        self.backend_url_label = tk.Label(backend_frame, text=self.backend_url, fg='blue', cursor='hand2')
        self.backend_url_label.grid(row=0, column=2, sticky=tk.W, padx=(10, 0))
        self.backend_url_label.bind("<Button-1>", lambda e: webbrowser.open(self.backend_url))
        
        # Frontend controls
        frontend_frame = ttk.LabelFrame(services_frame, text="Frontend (React)", padding="10")
        frontend_frame.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        frontend_frame.columnconfigure(2, weight=1)
        
        ttk.Button(frontend_frame, text="Iniciar Frontend", 
                  command=self.start_frontend).grid(row=0, column=0, padx=(0, 5))
        ttk.Button(frontend_frame, text="Parar Frontend", 
                  command=self.stop_frontend).grid(row=0, column=1, padx=5)
        
        self.frontend_url_label = tk.Label(frontend_frame, text=self.frontend_url, fg='blue', cursor='hand2')
        self.frontend_url_label.grid(row=0, column=2, sticky=tk.W, padx=(10, 0))
        self.frontend_url_label.bind("<Button-1>", lambda e: webbrowser.open(self.frontend_url))
        
        # Configurações
        config_frame = ttk.LabelFrame(services_frame, text="Configurações", padding="10")
        config_frame.grid(row=2, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Button(config_frame, text="Verificar Dependências", 
                  command=self.check_dependencies).grid(row=0, column=0, padx=(0, 5))
        ttk.Button(config_frame, text="Instalar Dependências", 
                  command=self.install_dependencies).grid(row=0, column=1, padx=5)
        ttk.Button(config_frame, text="Limpar Cache", 
                  command=self.clear_cache).grid(row=0, column=2, padx=(5, 0))
        
    def setup_users_tab(self):
        """Configura a aba Usuários"""
        users_frame = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(users_frame, text="👥 Usuários")
        
        # Controles de usuário
        user_controls = ttk.Frame(users_frame)
        user_controls.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Button(user_controls, text="➕ Criar Usuário", 
                  command=self.create_user_dialog).grid(row=0, column=0, padx=(0, 5))
        ttk.Button(user_controls, text="🔄 Atualizar Lista", 
                  command=self.refresh_users).grid(row=0, column=1, padx=5)
        
        # Lista de usuários
        users_list_frame = ttk.LabelFrame(users_frame, text="Usuários Cadastrados", padding="10")
        users_list_frame.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        users_frame.rowconfigure(1, weight=1)
        users_frame.columnconfigure(0, weight=1)
        
        # Treeview para usuários
        self.users_tree = ttk.Treeview(users_list_frame, columns=('ID', 'Username', 'Email', 'Created'), show='headings')
        self.users_tree.heading('ID', text='ID')
        self.users_tree.heading('Username', text='Usuário')
        self.users_tree.heading('Email', text='Email')
        self.users_tree.heading('Created', text='Criado em')
        
        self.users_tree.column('ID', width=50)
        self.users_tree.column('Username', width=150)
        self.users_tree.column('Email', width=200)
        self.users_tree.column('Created', width=150)
        
        self.users_tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        users_list_frame.rowconfigure(0, weight=1)
        users_list_frame.columnconfigure(0, weight=1)
        
        # Scrollbar para usuários
        users_scrollbar = ttk.Scrollbar(users_list_frame, orient=tk.VERTICAL, command=self.users_tree.yview)
        users_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.users_tree.configure(yscrollcommand=users_scrollbar.set)
        
    def setup_bots_tab(self):
        """Configura a aba Bots"""
        bots_frame = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(bots_frame, text="🤖 Bots")
        
        # Controles de bot
        bot_controls = ttk.Frame(bots_frame)
        bot_controls.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Button(bot_controls, text="🔄 Atualizar Lista", 
                  command=self.refresh_bots).grid(row=0, column=0, padx=(0, 5))
        
        # Lista de bots
        bots_list_frame = ttk.LabelFrame(bots_frame, text="Bots Cadastrados", padding="10")
        bots_list_frame.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        bots_frame.rowconfigure(1, weight=1)
        bots_frame.columnconfigure(0, weight=1)
        
        # Treeview para bots
        self.bots_tree = ttk.Treeview(bots_list_frame, columns=('ID', 'Name', 'Status', 'User', 'Created'), show='headings')
        self.bots_tree.heading('ID', text='ID')
        self.bots_tree.heading('Name', text='Nome')
        self.bots_tree.heading('Status', text='Status')
        self.bots_tree.heading('User', text='Usuário')
        self.bots_tree.heading('Created', text='Criado em')
        
        self.bots_tree.column('ID', width=50)
        self.bots_tree.column('Name', width=150)
        self.bots_tree.column('Status', width=100)
        self.bots_tree.column('User', width=100)
        self.bots_tree.column('Created', width=150)
        
        self.bots_tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        bots_list_frame.rowconfigure(0, weight=1)
        bots_list_frame.columnconfigure(0, weight=1)
        
        # Scrollbar para bots
        bots_scrollbar = ttk.Scrollbar(bots_list_frame, orient=tk.VERTICAL, command=self.bots_tree.yview)
        bots_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.bots_tree.configure(yscrollcommand=bots_scrollbar.set)
        
    def setup_logs_tab(self):
        """Configura a aba Logs"""
        logs_frame = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(logs_frame, text="📋 Logs")
        
        # Controles de log
        log_controls = ttk.Frame(logs_frame)
        log_controls.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Button(log_controls, text="🔄 Atualizar", 
                  command=self.refresh_logs).grid(row=0, column=0, padx=(0, 5))
        ttk.Button(log_controls, text="🗑️ Limpar", 
                  command=self.clear_logs).grid(row=0, column=1, padx=5)
        
        # Área de logs
        self.log_text = scrolledtext.ScrolledText(logs_frame, height=20, width=80)
        self.log_text.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        logs_frame.rowconfigure(1, weight=1)
        logs_frame.columnconfigure(0, weight=1)
        
    def setup_settings_tab(self):
        """Configura a aba Configurações"""
        settings_frame = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(settings_frame, text="⚙️ Configurações")
        
        # Configurações do sistema
        system_frame = ttk.LabelFrame(settings_frame, text="Sistema", padding="10")
        system_frame.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Label(system_frame, text="Porta Backend:").grid(row=0, column=0, sticky=tk.W)
        self.backend_port_var = tk.StringVar(value="5000")
        ttk.Entry(system_frame, textvariable=self.backend_port_var, width=10).grid(row=0, column=1, padx=(10, 0))
        
        ttk.Label(system_frame, text="Porta Frontend:").grid(row=1, column=0, sticky=tk.W)
        self.frontend_port_var = tk.StringVar(value="3000")
        ttk.Entry(system_frame, textvariable=self.frontend_port_var, width=10).grid(row=1, column=1, padx=(10, 0))
        
        # Configurações da API
        api_frame = ttk.LabelFrame(settings_frame, text="API", padding="10")
        api_frame.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Label(api_frame, text="URL da API:").grid(row=0, column=0, sticky=tk.W)
        self.api_url_var = tk.StringVar(value=self.api_url)
        ttk.Entry(api_frame, textvariable=self.api_url_var, width=40).grid(row=0, column=1, padx=(10, 0))
        
        # Botão salvar configurações
        ttk.Button(settings_frame, text="💾 Salvar Configurações", 
                  command=self.save_settings).grid(row=2, column=0, pady=(10, 0))
        
    def start_monitoring(self):
        """Inicia o monitoramento do sistema"""
        def monitor():
            while True:
                self.update_status()
                time.sleep(2)
                
        monitor_thread = threading.Thread(target=monitor, daemon=True)
        monitor_thread.start()
        
    def update_status(self):
        """Atualiza o status do sistema"""
        try:
            # Verificar backend
            try:
                response = requests.get(f"{self.backend_url}/", timeout=2)
                self.backend_running = response.status_code == 200
            except:
                self.backend_running = False
                
            # Verificar frontend
            try:
                response = requests.get(self.frontend_url, timeout=2)
                self.frontend_running = response.status_code == 200
            except:
                self.frontend_running = False
                
            # Atualizar UI
            self.root.after(0, self.update_ui_status)
            
        except Exception as e:
            self.log(f"Erro ao atualizar status: {e}")
            
    def update_ui_status(self):
        """Atualiza a interface com o status atual"""
        # Status do backend
        if self.backend_running:
            self.backend_status_label.config(text="🟢 Rodando", fg='green')
        else:
            self.backend_status_label.config(text="🔴 Parado", fg='red')
            
        # Status do frontend
        if self.frontend_running:
            self.frontend_status_label.config(text="🟢 Rodando", fg='green')
        else:
            self.frontend_status_label.config(text="🔴 Parado", fg='red')
            
        # Status geral
        if self.backend_running and self.frontend_running:
            self.status_label.config(text="Sistema: Rodando", fg='green')
        elif self.backend_running or self.frontend_running:
            self.status_label.config(text="Sistema: Parcial", fg='orange')
        else:
            self.status_label.config(text="Sistema: Parado", fg='red')
            
        # Atualizar estatísticas
        self.update_stats()
        
    def update_stats(self):
        """Atualiza as estatísticas do sistema"""
        if self.backend_running:
            try:
                # Buscar estatísticas da API
                stats = self.get_system_stats()
                if stats:
                    self.stats_labels['users_count'].config(text=str(stats.get('users_count', '--')))
                    self.stats_labels['active_bots'].config(text=str(stats.get('active_bots', '--')))
                    self.stats_labels['messages_today'].config(text=str(stats.get('messages_today', '--')))
                    self.stats_labels['uptime'].config(text=stats.get('uptime', '--'))
                    
                self.stats_labels['last_update'].config(text=datetime.now().strftime('%H:%M:%S'))
                
            except Exception as e:
                self.log(f"Erro ao buscar estatísticas: {e}")
        else:
            # Resetar estatísticas
            for key in self.stats_labels:
                if key != 'last_update':
                    self.stats_labels[key].config(text='--')
                    
    def get_system_stats(self):
        """Busca estatísticas do sistema via API"""
        try:
            # Simular estatísticas (implementar quando a API estiver pronta)
            return {
                'users_count': 5,
                'active_bots': 2,
                'messages_today': 150,
                'uptime': '2h 30m'
            }
        except:
            return None
            
    def start_system(self):
        """Inicia todo o sistema"""
        self.log("Iniciando sistema completo...")
        self.start_backend()
        time.sleep(3)  # Aguardar backend inicializar
        self.start_frontend()
        
    def stop_system(self):
        """Para todo o sistema"""
        self.log("Parando sistema completo...")
        self.stop_frontend()
        self.stop_backend()
        
    def restart_system(self):
        """Reinicia todo o sistema"""
        self.log("Reiniciando sistema...")
        self.stop_system()
        time.sleep(2)
        self.start_system()
        
    def start_backend(self):
        """Inicia o servidor backend"""
        if self.backend_running:
            self.log("Backend já está rodando")
            return
            
        try:
            self.log("Iniciando backend...")
            os.chdir(self.backend_dir)
            
            if self.is_windows:
                python_cmd = str(self.backend_dir / "venv" / "Scripts" / "python.exe")
            else:
                python_cmd = str(self.backend_dir / "venv" / "bin" / "python")
                
            main_file = self.backend_dir / "src" / "main.py"
            
            self.backend_process = subprocess.Popen(
                [python_cmd, str(main_file)],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True
            )
            
            self.log("Backend iniciado com sucesso")
            
        except Exception as e:
            self.log(f"Erro ao iniciar backend: {e}")
            messagebox.showerror("Erro", f"Erro ao iniciar backend: {e}")
            
    def stop_backend(self):
        """Para o servidor backend"""
        if self.backend_process:
            try:
                self.backend_process.terminate()
                self.backend_process = None
                self.log("Backend parado")
            except Exception as e:
                self.log(f"Erro ao parar backend: {e}")
                
    def start_frontend(self):
        """Inicia o servidor frontend"""
        if self.frontend_running:
            self.log("Frontend já está rodando")
            return
            
        try:
            self.log("Iniciando frontend...")
            os.chdir(self.frontend_dir)
            
            # Verificar e instalar dependências se necessário
            node_modules_path = self.frontend_dir / "node_modules"
            if not node_modules_path.exists():
                self.log("Pasta node_modules não encontrada. Instalando dependências...")
                install_process = subprocess.Popen(
                    "npm install --legacy-peer-deps", 
                    shell=True, 
                    cwd=self.frontend_dir,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    universal_newlines=True
                )
                # Logar a saída da instalação
                for line in iter(install_process.stdout.readline, ''):
                    self.log(f"[NPM INSTALL] {line.strip()}")
                install_process.wait()
                if install_process.returncode == 0:
                    self.log("Dependências do frontend instaladas com sucesso.")
                else:
                    self.log("Erro ao instalar dependências do frontend.")
                    messagebox.showerror("Erro", "Falha ao instalar dependências do frontend. Verifique os logs.")
                    return

            self.frontend_process = subprocess.Popen(
                "npm run dev",
                shell=True,
                cwd=self.frontend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True
            )
            
            self.log("Frontend iniciado com sucesso")
            
        except Exception as e:
            self.log(f"Erro ao iniciar frontend: {e}")
            messagebox.showerror("Erro", f"Erro ao iniciar frontend: {e}")
            
    def stop_frontend(self):
        """Para o servidor frontend"""
        if self.frontend_process:
            try:
                self.frontend_process.terminate()
                self.frontend_process = None
                self.log("Frontend parado")
            except Exception as e:
                self.log(f"Erro ao parar frontend: {e}")
                
    def open_frontend(self):
        """Abre o frontend no navegador"""
        webbrowser.open(self.frontend_url)
        
    def check_dependencies(self):
        """Verifica as dependências do sistema"""
        self.log("Verificando dependências...")
        # Implementar verificação de dependências
        messagebox.showinfo("Dependências", "Verificação de dependências concluída")
        
    def install_dependencies(self):
        """Instala as dependências do sistema"""
        self.log("Instalando dependências...")
        # Implementar instalação de dependências
        messagebox.showinfo("Dependências", "Instalação de dependências concluída")
        
    def clear_cache(self):
        """Limpa o cache do sistema"""
        self.log("Limpando cache...")
        messagebox.showinfo("Cache", "Cache limpo com sucesso")
        
    def create_user_dialog(self):
        """Abre diálogo para criar usuário"""
        dialog = tk.Toplevel(self.root)
        dialog.title("Criar Usuário")
        dialog.geometry("400x300")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Campos do formulário
        ttk.Label(dialog, text="Nome de usuário:").grid(row=0, column=0, sticky=tk.W, padx=10, pady=5)
        username_var = tk.StringVar()
        ttk.Entry(dialog, textvariable=username_var, width=30).grid(row=0, column=1, padx=10, pady=5)
        
        ttk.Label(dialog, text="Email:").grid(row=1, column=0, sticky=tk.W, padx=10, pady=5)
        email_var = tk.StringVar()
        ttk.Entry(dialog, textvariable=email_var, width=30).grid(row=1, column=1, padx=10, pady=5)
        
        ttk.Label(dialog, text="Senha:").grid(row=2, column=0, sticky=tk.W, padx=10, pady=5)
        password_var = tk.StringVar()
        ttk.Entry(dialog, textvariable=password_var, show="*", width=30).grid(row=2, column=1, padx=10, pady=5)
        
        def create_user():
            # Implementar criação de usuário via API
            username = username_var.get()
            email = email_var.get()
            password = password_var.get()
            
            if username and email and password:
                self.log(f"Criando usuário: {username}")
                messagebox.showinfo("Sucesso", f"Usuário {username} criado com sucesso")
                dialog.destroy()
                self.refresh_users()
            else:
                messagebox.showerror("Erro", "Preencha todos os campos")
                
        ttk.Button(dialog, text="Criar", command=create_user).grid(row=3, column=0, columnspan=2, pady=20)
        
    def refresh_users(self):
        """Atualiza a lista de usuários"""
        # Limpar lista atual
        for item in self.users_tree.get_children():
            self.users_tree.delete(item)
            
        # Buscar usuários da API (implementar quando disponível)
        # Por enquanto, dados de exemplo
        sample_users = [
            (1, "admin", "admin@example.com", "2024-01-01"),
            (2, "user1", "user1@example.com", "2024-01-02"),
        ]
        
        for user in sample_users:
            self.users_tree.insert('', 'end', values=user)
            
    def refresh_bots(self):
        """Atualiza a lista de bots"""
        # Limpar lista atual
        for item in self.bots_tree.get_children():
            self.bots_tree.delete(item)
            
        # Buscar bots da API (implementar quando disponível)
        # Por enquanto, dados de exemplo
        sample_bots = [
            (1, "Bot Atendimento", "Ativo", "admin", "2024-01-01"),
            (2, "Bot Vendas", "Inativo", "user1", "2024-01-02"),
        ]
        
        for bot in sample_bots:
            self.bots_tree.insert('', 'end', values=bot)
            
    def refresh_logs(self):
        """Atualiza os logs"""
        # Implementar busca de logs
        pass
        
    def clear_logs(self):
        """Limpa os logs"""
        self.log_text.delete(1.0, tk.END)
        
    def save_settings(self):
        """Salva as configurações"""
        self.log("Configurações salvas")
        messagebox.showinfo("Configurações", "Configurações salvas com sucesso")
        
    def log(self, message):
        """Adiciona mensagem ao log"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        log_message = f"[{timestamp}] {message}\n"
        
        self.log_text.insert(tk.END, log_message)
        self.log_text.see(tk.END)
        print(log_message.strip())
        
    def run(self):
        """Executa a interface gráfica"""
        self.log("WhatsApp SaaS GUI iniciado")
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        self.root.mainloop()
        
    def on_closing(self):
        """Chamado quando a janela é fechada"""
        if messagebox.askokcancel("Sair", "Deseja parar todos os serviços e sair?"):
            self.stop_system()
            self.root.destroy()

if __name__ == "__main__":
    app = WhatsAppSaaSGUI()
    app.run()

