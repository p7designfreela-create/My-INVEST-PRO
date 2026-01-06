
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, FileText, PieChart, DollarSign, Copy, TrendingUp, TrendingDown, 
  Info, Save, Sparkles, X, Loader2, Send, RefreshCw, Wallet, 
  BarChart3, Calendar as CalendarIcon, Newspaper, Bell, ArrowUpRight, ArrowDownRight, Search,
  Activity, Layers, Briefcase, List, Moon, Sun, Palette, Filter, AlertTriangle, Calendar,
  Download, Printer, Calculator, MinusCircle, Star, Heart, Eye
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- Utilitários ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const cleanAndParseJSON = (text: string | null) => {
  if (!text) return null;
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      console.warn("Resposta da IA não contém JSON válido.");
      return null;
    }
    const cleaned = text.substring(firstBrace, lastBrace + 1);
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return null;
  }
};

// --- CONFIGURAÇÃO DE TEMAS ---
const THEMES: Record<string, any> = {
  light: {
    id: 'light', name: 'Claro', icon: Sun,
    bg: 'bg-gray-50', text: 'text-gray-800', subText: 'text-gray-500',
    card: 'bg-white', cardBorder: 'border-gray-200',
    nav: 'bg-white/90', input: 'bg-gray-50 border-gray-200 focus:ring-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    gridColor: 'text-gray-300', chartTooltip: 'bg-gray-800 text-white',
    highlight: 'bg-blue-50', accent: 'text-blue-600', tableHeader: 'bg-gray-100 text-gray-600',
    success: 'text-green-600', danger: 'text-red-600', warning: 'text-amber-600'
  },
  dark: {
    id: 'dark', name: 'Escuro', icon: Moon,
    bg: 'bg-slate-900', text: 'text-slate-100', subText: 'text-slate-400',
    card: 'bg-slate-800', cardBorder: 'border-slate-700',
    nav: 'bg-slate-900/90', input: 'bg-slate-900 border-slate-700 focus:ring-blue-500 text-slate-100',
    button: 'bg-blue-600 hover:bg-blue-500 text-white',
    gridColor: 'text-slate-600', chartTooltip: 'bg-slate-700 text-white',
    highlight: 'bg-slate-700', accent: 'text-blue-400', tableHeader: 'bg-slate-700 text-slate-300',
    success: 'text-green-400', danger: 'text-red-400', warning: 'text-amber-400'
  },
  ocean: {
    id: 'ocean', name: 'Oceano', icon: Palette,
    bg: 'bg-cyan-950', text: 'text-cyan-50', subText: 'text-cyan-300',
    card: 'bg-cyan-900', cardBorder: 'border-cyan-800',
    nav: 'bg-cyan-950/90', input: 'bg-cyan-950 border-cyan-700 focus:ring-cyan-400 text-cyan-100',
    button: 'bg-cyan-600 hover:bg-cyan-500 text-white',
    gridColor: 'text-cyan-800', chartTooltip: 'bg-cyan-800 text-white',
    highlight: 'bg-cyan-800', accent: 'text-cyan-400', tableHeader: 'bg-cyan-800 text-cyan-200',
    success: 'text-emerald-400', danger: 'text-rose-400', warning: 'text-yellow-400'
  }
};

// --- BASE DE DADOS DE ATIVOS ---
const B3_ASSETS: { t: string; n: string; type: string; s: string }[] = [
  // BANCOS
  { t: 'BBAS3', n: 'Banco do Brasil ON', type: 'ACAO', s: 'Bancos' },
  { t: 'BBDC3', n: 'Bradesco ON', type: 'ACAO', s: 'Bancos' },
  { t: 'BBDC4', n: 'Bradesco PN', type: 'ACAO', s: 'Bancos' },
  { t: 'BPAC11', n: 'BTG Pactual Unit', type: 'ACAO', s: 'Bancos' },
  { t: 'BPAC3', n: 'BTG Pactual ON', type: 'ACAO', s: 'Bancos' },
  { t: 'BPAC5', n: 'BTG Pactual PNA', type: 'ACAO', s: 'Bancos' },
  { t: 'ITUB3', n: 'Itaú Unibanco ON', type: 'ACAO', s: 'Bancos' },
  { t: 'ITUB4', n: 'Itaú Unibanco PN', type: 'ACAO', s: 'Bancos' },
  { t: 'ITSA3', n: 'Itaúsa ON', type: 'ACAO', s: 'Bancos' },
  { t: 'ITSA4', n: 'Itaúsa PN', type: 'ACAO', s: 'Bancos' },
  { t: 'SANB3', n: 'Santander ON', type: 'ACAO', s: 'Bancos' },
  { t: 'SANB4', n: 'Santander PN', type: 'ACAO', s: 'Bancos' },
  { t: 'SANB11', n: 'Santander Unit', type: 'ACAO', s: 'Bancos' },
  { t: 'ABCB4', n: 'ABC Brasil PN', type: 'ACAO', s: 'Bancos' },
  { t: 'BRSR6', n: 'Banrisul PNB', type: 'ACAO', s: 'Bancos' },
  { t: 'BNBR3', n: 'Banco do Nordeste', type: 'ACAO', s: 'Bancos' },

  // FINANCEIRO / SEGUROS
  { t: 'B3SA3', n: 'B3 ON', type: 'ACAO', s: 'Financeiro' },
  { t: 'CIEL3', n: 'Cielo ON', type: 'ACAO', s: 'Financeiro' },
  { t: 'BBSE3', n: 'BB Seguridade ON', type: 'ACAO', s: 'Seguros' },
  { t: 'CXSE3', n: 'Caixa Seguridade ON', type: 'ACAO', s: 'Seguros' },
  { t: 'PSSA3', n: 'Porto Seguro ON', type: 'ACAO', s: 'Seguros' },
  { t: 'IRBR3', n: 'IRB Brasil ON', type: 'ACAO', s: 'Seguros' },

  // PETRÓLEO, GÁS E PETROQUÍMICA
  { t: 'PETR3', n: 'Petrobras ON', type: 'ACAO', s: 'Petróleo e Gás' },
  { t: 'PETR4', n: 'Petrobras PN', type: 'ACAO', s: 'Petróleo e Gás' },
  { t: 'PRIO3', n: 'PetroRio ON', type: 'ACAO', s: 'Petróleo e Gás' },
  { t: 'RRRP3', n: '3R Petroleum ON', type: 'ACAO', s: 'Petróleo e Gás' },
  { t: 'RECV3', n: 'PetroRecôncavo ON', type: 'ACAO', s: 'Petróleo e Gás' },
  { t: 'ENAT3', n: 'Enauta ON', type: 'ACAO', s: 'Petróleo e Gás' },
  { t: 'VBBR3', n: 'Vibra Energia ON', type: 'ACAO', s: 'Petróleo e Gás' },
  { t: 'UGPA3', n: 'Ultrapar ON', type: 'ACAO', s: 'Petróleo e Gás' },
  { t: 'CSAN3', n: 'Cosan ON', type: 'ACAO', s: 'Petróleo e Gás' },
  { t: 'BRKM3', n: 'Braskem ON', type: 'ACAO', s: 'Petroquímica' },
  { t: 'BRKM5', n: 'Braskem PNA', type: 'ACAO', s: 'Petroquímica' },
  { t: 'UNIP3', n: 'Unipar ON', type: 'ACAO', s: 'Petroquímica' },
  { t: 'UNIP6', n: 'Unipar PNB', type: 'ACAO', s: 'Petroquímica' },

  // MINERAÇÃO E SIDERURGIA
  { t: 'VALE3', n: 'Vale ON', type: 'ACAO', s: 'Mineração' },
  { t: 'CMIN3', n: 'CSN Mineração ON', type: 'ACAO', s: 'Mineração' },
  { t: 'CSNA3', n: 'CSN ON', type: 'ACAO', s: 'Siderurgia' },
  { t: 'GGBR3', n: 'Gerdau ON', type: 'ACAO', s: 'Siderurgia' },
  { t: 'GGBR4', n: 'Gerdau PN', type: 'ACAO', s: 'Siderurgia' },
  { t: 'GOAU3', n: 'Metalúrgica Gerdau ON', type: 'ACAO', s: 'Siderurgia' },
  { t: 'GOAU4', n: 'Metalúrgica Gerdau PN', type: 'ACAO', s: 'Siderurgia' },
  { t: 'USIM3', n: 'Usiminas ON', type: 'ACAO', s: 'Siderurgia' },
  { t: 'USIM5', n: 'Usiminas PNA', type: 'ACAO', s: 'Siderurgia' },
  { t: 'FESA4', n: 'Ferbasa PN', type: 'ACAO', s: 'Siderurgia' },
  { t: 'SEER3', n: 'Ser Educacional ON', type: 'ACAO', s: 'Educação' },

  // ENERGIA ELÉTRICA
  { t: 'ELET3', n: 'Eletrobras ON', type: 'ACAO', s: 'Energia' },
  { t: 'ELET6', n: 'Eletrobras PNB', type: 'ACAO', s: 'Energia' },
  { t: 'EGIE3', n: 'Engie Brasil ON', type: 'ACAO', s: 'Energia' },
  { t: 'TAEE3', n: 'Taesa ON', type: 'ACAO', s: 'Energia' },
  { t: 'TAEE4', n: 'Taesa PN', type: 'ACAO', s: 'Energia' },
  { t: 'TAEE11', n: 'Taesa Unit', type: 'ACAO', s: 'Energia' },
  { t: 'TRPL4', n: 'ISA CTEEP PN', type: 'ACAO', s: 'Energia' },
  { t: 'CPLE3', n: 'Copel ON', type: 'ACAO', s: 'Energia' },
  { t: 'CPLE6', n: 'Copel PNB', type: 'ACAO', s: 'Energia' },
  { t: 'CPLE11', n: 'Copel Unit', type: 'ACAO', s: 'Energia' },
  { t: 'CMIG3', n: 'Cemig ON', type: 'ACAO', s: 'Energia' },
  { t: 'CMIG4', n: 'Cemig PN', type: 'ACAO', s: 'Energia' },
  { t: 'CPFE3', n: 'CPFL Energia ON', type: 'ACAO', s: 'Energia' },
  { t: 'EQTL3', n: 'Equatorial ON', type: 'ACAO', s: 'Energia' },
  { t: 'NEOE3', n: 'Neoenergia ON', type: 'ACAO', s: 'Energia' },
  { t: 'ENBR3', n: 'EDP Brasil ON', type: 'ACAO', s: 'Energia' },
  { t: 'ENEV3', n: 'Eneva ON', type: 'ACAO', s: 'Energia' },
  { t: 'ENGI11', n: 'Energisa Unit', type: 'ACAO', s: 'Energia' },
  { t: 'AURE3', n: 'Auren Energia ON', type: 'ACAO', s: 'Energia' },
  { t: 'AESB3', n: 'AES Brasil ON', type: 'ACAO', s: 'Energia' },
  { t: 'ALUP11', n: 'Alupar Unit', type: 'ACAO', s: 'Energia' },

  // SANEAMENTO
  { t: 'SBSP3', n: 'Sabesp ON', type: 'ACAO', s: 'Saneamento' },
  { t: 'SAPR3', n: 'Sanepar ON', type: 'ACAO', s: 'Saneamento' },
  { t: 'SAPR4', n: 'Sanepar PN', type: 'ACAO', s: 'Saneamento' },
  { t: 'SAPR11', n: 'Sanepar Unit', type: 'ACAO', s: 'Saneamento' },
  { t: 'CSMG3', n: 'Copasa ON', type: 'ACAO', s: 'Saneamento' },
  { t: 'AMBP3', n: 'Ambipar ON', type: 'ACAO', s: 'Saneamento' },

  // VAREJO E CONSUMO
  { t: 'MGLU3', n: 'Magazine Luiza ON', type: 'ACAO', s: 'Varejo' },
  { t: 'LREN3', n: 'Lojas Renner ON', type: 'ACAO', s: 'Varejo' },
  { t: 'BHIA3', n: 'Casas Bahia ON', type: 'ACAO', s: 'Varejo' },
  { t: 'VIIA3', n: 'Via ON (Antigo)', type: 'ACAO', s: 'Varejo' },
  { t: 'AMER3', n: 'Americanas ON', type: 'ACAO', s: 'Varejo' },
  { t: 'ARZZ3', n: 'Arezzo ON', type: 'ACAO', s: 'Varejo' },
  { t: 'SOMA3', n: 'Grupo Soma ON', type: 'ACAO', s: 'Varejo' },
  { t: 'PETZ3', n: 'Petz ON', type: 'ACAO', s: 'Varejo' },
  { t: 'ALPA4', n: 'Alpargatas PN', type: 'ACAO', s: 'Varejo' },
  { t: 'CRFB3', n: 'Carrefour Brasil ON', type: 'ACAO', s: 'Varejo Alimentar' },
  { t: 'ASAI3', n: 'Assaí ON', type: 'ACAO', s: 'Varejo Alimentar' },
  { t: 'GMAT3', n: 'Grupo Mateus ON', type: 'ACAO', s: 'Varejo Alimentar' },
  { t: 'ABEV3', n: 'Ambev ON', type: 'ACAO', s: 'Bebidas' },
  { t: 'JBSS3', n: 'JBS ON', type: 'ACAO', s: 'Alimentos' },
  { t: 'BRFS3', n: 'BRF ON', type: 'ACAO', s: 'Alimentos' },
  { t: 'BEEF3', n: 'Minerva ON', type: 'ACAO', s: 'Alimentos' },
  { t: 'MRFG3', n: 'Marfrig ON', type: 'ACAO', s: 'Alimentos' },
  { t: 'SMTO3', n: 'São Martinho ON', type: 'ACAO', s: 'Sucroenergético' },
  { t: 'SLCE3', n: 'SLC Agrícola ON', type: 'ACAO', s: 'Agronegócio' },
  { t: 'MDIA3', n: 'M. Dias Branco ON', type: 'ACAO', s: 'Alimentos' },
  { t: 'CAML3', n: 'Camil ON', type: 'ACAO', s: 'Alimentos' },
  { t: 'NTCO3', n: 'Natura ON', type: 'ACAO', s: 'Cosméticos' },

  // INDÚSTRIA E BENS DE CAPITAL
  { t: 'WEGE3', n: 'Weg ON', type: 'ACAO', s: 'Bens Industriais' },
  { t: 'EMBR3', n: 'Embraer ON', type: 'ACAO', s: 'Industrial' },
  { t: 'POMO4', n: 'Marcopolo PN', type: 'ACAO', s: 'Industrial' },
  { t: 'RAPT4', n: 'Randon PN', type: 'ACAO', s: 'Industrial' },
  { t: 'TASA4', n: 'Taurus Armas PN', type: 'ACAO', s: 'Industrial' },
  { t: 'KEPL3', n: 'Kepler Weber ON', type: 'ACAO', s: 'Industrial' },
  { t: 'SUZB3', n: 'Suzano ON', type: 'ACAO', s: 'Papel e Celulose' },
  { t: 'KLBN3', n: 'Klabin ON', type: 'ACAO', s: 'Papel e Celulose' },
  { t: 'KLBN4', n: 'Klabin PN', type: 'ACAO', s: 'Papel e Celulose' },
  { t: 'KLBN11', n: 'Klabin Unit', type: 'ACAO', s: 'Papel e Celulose' },
  { t: 'RANI3', n: 'Irani ON', type: 'ACAO', s: 'Papel e Celulose' },

  // CONSTRUÇÃO E IMOBILIÁRIO
  { t: 'CYRE3', n: 'Cyrela ON', type: 'ACAO', s: 'Construção Civil' },
  { t: 'EZTC3', n: 'EZTEC ON', type: 'ACAO', s: 'Construção Civil' },
  { t: 'MRVE3', n: 'MRV ON', type: 'ACAO', s: 'Construção Civil' },
  { t: 'TEND3', n: 'Tenda ON', type: 'ACAO', s: 'Construção Civil' },
  { t: 'JHSF3', n: 'JHSF ON', type: 'ACAO', s: 'Imobiliário' },
  { t: 'DIRR3', n: 'Direcional ON', type: 'ACAO', s: 'Construção Civil' },
  { t: 'CURY3', n: 'Cury ON', type: 'ACAO', s: 'Construção Civil' },

  // TECNOLOGIA, SAÚDE E EDUCAÇÃO
  { t: 'TOTS3', n: 'Totvs ON', type: 'ACAO', s: 'Tecnologia' },
  { t: 'LWSA3', n: 'Locaweb ON', type: 'ACAO', s: 'Tecnologia' },
  { t: 'INTB3', n: 'Intelbras ON', type: 'ACAO', s: 'Tecnologia' },
  { t: 'MLAS3', n: 'Multilaser ON', type: 'ACAO', s: 'Tecnologia' },
  { t: 'HAPV3', n: 'Hapvida ON', type: 'ACAO', s: 'Saúde' },
  { t: 'RDOR3', n: 'Rede D\'Or ON', type: 'ACAO', s: 'Saúde' },
  { t: 'RADL3', n: 'Raia Drogasil ON', type: 'ACAO', s: 'Saúde' },
  { t: 'FLRY3', n: 'Fleury ON', type: 'ACAO', s: 'Saúde' },
  { t: 'QUAL3', n: 'Qualicorp ON', type: 'ACAO', s: 'Saúde' },
  { t: 'VVEO3', n: 'Viveo ON', type: 'ACAO', s: 'Saúde' },
  { t: 'YDUQ3', n: 'Yduqs ON', type: 'ACAO', s: 'Educação' },
  { t: 'COGN3', n: 'Cogna ON', type: 'ACAO', s: 'Educação' },

  // TRANSPORTES E LOGÍSTICA
  { t: 'CCRO3', n: 'CCR ON', type: 'ACAO', s: 'Infraestrutura' },
  { t: 'ECOR3', n: 'Ecorodovias ON', type: 'ACAO', s: 'Infraestrutura' },
  { t: 'RAIL3', n: 'Rumo ON', type: 'ACAO', s: 'Logística' },
  { t: 'STBP3', n: 'Santos Brasil ON', type: 'ACAO', s: 'Logística' },
  { t: 'RENT3', n: 'Localiza ON', type: 'ACAO', s: 'Aluguel de Carros' },
  { t: 'MOVI3', n: 'Movida ON', type: 'ACAO', s: 'Aluguel de Carros' },
  { t: 'AZUL4', n: 'Azul PN', type: 'ACAO', s: 'Aéreo' },
  { t: 'GOLL4', n: 'Gol PN', type: 'ACAO', s: 'Aéreo' },
  { t: 'CVCB3', n: 'CVC Brasil ON', type: 'ACAO', s: 'Turismo' },

  // --- FIIs ---
  { t: 'MXRF11', n: 'Maxi Renda', type: 'FII', s: 'FII Papel' },
  { t: 'HGLG11', n: 'CSHG Logística', type: 'FII', s: 'FII Logística' },
  { t: 'KNRI11', n: 'Kinea Renda', type: 'FII', s: 'FII Híbrido' },
  { t: 'XPLG11', n: 'XP Logística', type: 'FII', s: 'FII Logística' },
  { t: 'VISC11', n: 'Vinci Shopping', type: 'FII', s: 'FII Shopping' },
  { t: 'XPML11', n: 'XP Malls', type: 'FII', s: 'FII Shopping' },
  { t: 'HGBS11', n: 'CSHG Shopping', type: 'FII', s: 'FII Shopping' },
  { t: 'MALL11', n: 'Malls Brasil Plural', type: 'FII', s: 'FII Shopping' },
  { t: 'HSML11', n: 'HSI Malls', type: 'FII', s: 'FII Shopping' },
  { t: 'BTLG11', n: 'BTG Logística', type: 'FII', s: 'FII Logística' },
  { t: 'BRCO11', n: 'Bresco Logística', type: 'FII', s: 'FII Logística' },
  { t: 'LVBI11', n: 'VBI Logística', type: 'FII', s: 'FII Logística' },
  { t: 'VILG11', n: 'Vinci Logística', type: 'FII', s: 'FII Logística' },
  { t: 'RBRL11', n: 'RBR Logística', type: 'FII', s: 'FII Logística' },
  { t: 'GGRC11', n: 'GGR Covepi', type: 'FII', s: 'FII Logística' },
  { t: 'GALG11', n: 'Guardian Logística (Antigo)', type: 'FII', s: 'FII Logística' },
  { t: 'GARE11', n: 'Guardian Logística', type: 'FII', s: 'FII Logística' },
  { t: 'BLMG11', n: 'BlueMacaw Logística', type: 'FII', s: 'FII Logística' },
  { t: 'PATL11', n: 'Pátria Logística', type: 'FII', s: 'FII Logística' }
];

const ASSET_TYPES: Record<string, { label: string; code: string; color: string }> = {
  ACAO: { label: 'Ação', code: '31', color: '#3b82f6' },     
  FII: { label: 'FII', code: '73', color: '#22c55e' },      
  ETF: { label: 'ETF', code: '74', color: '#f97316' },    
  BDR: { label: 'BDR', code: '49', color: '#8b5cf6' },    
  CRIPTO: { label: 'Cripto', code: '01', color: '#ef4444' }     
};

const BROKERS = [
  'XP Investimentos', 'Rico', 'Clear', 'NuInvest / Nubank', 'BTG Pactual', 
  'Banco Inter', 'Ágora / Bradesco', 'Itaú Corretora', 'Santander', 'Binance', 'Outra'
];

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// --- Componentes Visuais ---

const StatCard = ({ title, value, subtext, icon: Icon, trend = 'neutral', theme }: any) => (
  <div className={`${theme.card} backdrop-blur-lg p-5 rounded-2xl shadow-sm border ${theme.cardBorder} hover:shadow-md transition-all duration-300 relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : theme.accent}`}>
      <Icon size={80} />
    </div>
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-2 rounded-lg ${trend === 'up' ? 'bg-green-100/10 text-green-500' : trend === 'down' ? 'bg-red-100/10 text-red-500' : theme.highlight + ' ' + theme.accent}`}>
        <Icon size={18} />
      </div>
      <span className={`text-xs font-semibold ${theme.subText} uppercase tracking-wider`}>{title}</span>
    </div>
    <div className={`text-2xl font-bold ${theme.text} tracking-tight`}>{value}</div>
    {subtext && <div className={`text-xs ${theme.subText} mt-1 font-medium`}>{subtext}</div>}
  </div>
);

const FlexibleChart = ({ data, type = 'bar', color = '#3b82f6', height = 200, formatValue = (v: any) => v, onSliceClick = () => {}, theme }: any) => {
  if (!data || data.length === 0) return <div className={`h-full flex items-center justify-center ${theme.subText} text-xs`}>Sem dados</div>;
  const maxValue = Math.max(...data.map((d: any) => d.value)) || 1;

  if (type === 'pie' || type === 'donut') {
    const total = data.reduce((sum: number, item: any) => sum + Math.max(0, item.value), 0);
    let cumulativePercent = 0;
    
    const generateColor = (index: number, baseColor: string) => {
        const palette = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ef4444', '#eab308', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];
        return palette[index % palette.length];
    };

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative select-none p-2" style={{ height: 'auto', minHeight: `${height}px` }}>
         <div className="relative mb-4" style={{ width: '160px', height: '160px' }}>
            <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }} className="w-full h-full overflow-visible">
               {data.map((d: any, i: number) => {
                   const val = Math.max(0, d.value);
                   const percent = val / total;
                   if (percent === 0) return null;
                   
                   const startPercent = cumulativePercent;
                   const endPercent = cumulativePercent + percent;
                   cumulativePercent += percent;
                   
                   const isFullCircle = percent > 0.999;
                   const [startX, startY] = getCoordinatesForPercent(startPercent);
                   const [endX, endY] = getCoordinatesForPercent(endPercent);
                   const largeArcFlag = percent > .5 ? 1 : 0;
                   const pathData = isFullCircle ? `M 1 0 A 1 1 0 1 1 -1 0 A 1 1 0 1 1 1 0` : `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;

                   return <path key={i} d={pathData} fill={generateColor(i, color)} stroke={theme.id === 'light' ? 'white' : '#1e293b'} strokeWidth="0.02" className="hover:opacity-80 transition-opacity cursor-pointer" onClick={() => onSliceClick && onSliceClick(d)} />;
               })}
            </svg>
            {type === 'donut' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`${theme.card} w-24 h-24 rounded-full shadow-sm flex items-center justify-center`}>
                        <span className={`text-[10px] font-bold ${theme.subText}`}>Total</span>
                    </div>
                </div>
            )}
         </div>
         <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full max-h-32 overflow-y-auto">
            {data.map((d: any, i: number) => {
               const val = Math.max(0, d.value);
               const percent = (val / total) * 100;
               if (percent < 1) return null; 
               return (
                  <div key={i} className={`flex items-center gap-1.5 text-[10px] ${theme.subText} cursor-pointer hover:opacity-80 rounded p-0.5 transition-colors`} onClick={() => onSliceClick && onSliceClick(d)}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: generateColor(i, color) }}></div>
                    <div className="flex justify-between w-full"><span className="truncate max-w-[80px]" title={d.label}>{d.label}</span><span className="font-bold">{percent.toFixed(0)}%</span></div>
                  </div>
               );
            })}
         </div>
      </div>
    )
  }

  if (type === 'bar-horizontal') {
      const sortedData = [...data].sort((a,b) => b.value - a.value).slice(0, 5); 
      const maxVal = sortedData[0]?.value || 1;
      return (
          <div className="w-full flex flex-col gap-2 p-2" style={{ minHeight: `${height}px` }}>
              {sortedData.map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                      <span className={`text-[10px] w-12 font-bold ${theme.subText} truncate`}>{d.label}</span>
                      <div className={`flex-1 ${theme.highlight} rounded-full h-3 overflow-hidden relative`}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(d.value / maxVal) * 100}%`, backgroundColor: color }} />
                      </div>
                      <span className={`text-[10px] w-16 text-right ${theme.subText}`}>{formatValue(d.value)}</span>
                  </div>
              ))}
          </div>
      )
  }

  return (
    <div className="w-full relative select-none" style={{ height: `${height}px` }}>
      <div className={`absolute inset-0 flex flex-col justify-between text-[10px] ${theme.gridColor} pointer-events-none`}>
        <div className={`border-b border-dashed ${theme.cardBorder.replace('border', 'border-opacity-30')} w-full`}></div>
        <div className={`border-b border-dashed ${theme.cardBorder.replace('border', 'border-opacity-30')} w-full`}></div>
        <div className={`border-b border-dashed ${theme.cardBorder.replace('border', 'border-opacity-30')} w-full`}></div>
      </div>
      <div className="absolute inset-0 flex items-end justify-between px-2 gap-2">
        {data.map((item: any, idx: number) => {
          const percent = (item.value / maxValue) * 100;
          const isNegative = item.value < 0;
          if (type === 'bar') {
            return (
              <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full group relative" onClick={() => onSliceClick && onSliceClick(item)}>
                 <div className={`absolute bottom-full mb-1 hidden group-hover:block ${theme.chartTooltip} text-[10px] p-2 rounded-lg z-20 whitespace-nowrap shadow-xl border ${theme.cardBorder} flex flex-col gap-1`}>
                    <span className="font-bold">{item.label}</span>
                    <span>{formatValue(item.value)}</span>
                    {item.yield !== undefined && (
                       <span className="text-[9px] opacity-90 border-t border-white/20 pt-1 mt-1 block">
                           DY: {item.yield.toFixed(2)}%
                           <br/>Inv: {formatCurrency(item.invested)}
                       </span>
                    )}
                 </div>
                 <div className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 relative cursor-pointer ${isNegative ? 'bg-red-400' : ''}`} style={{ height: `${Math.abs(percent)}%`, backgroundColor: isNegative ? '#ef4444' : color, opacity: 0.8 }}></div>
                 <span className={`text-[10px] ${theme.subText} mt-1 truncate w-full text-center`}>{item.label}</span>
              </div>
            );
          }
          return null;
        })}
        {(type === 'line' || type === 'area') && (
           <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
              {type === 'area' && (<defs><linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.5"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>)}
              {type === 'area' && <polygon fill={`url(#grad-${color})`} stroke={color} strokeWidth="2" points={`0,100 ${data.map((d: any, i: number) => `${(i / (data.length - 1)) * 100},${100 - ((d.value / maxValue) * 90)}`).join(' ')} 100,100`} vectorEffect="non-scaling-stroke"/>}
              {type === 'line' && <polyline fill="none" stroke={color} strokeWidth="3" points={data.map((d: any, i: number) => `${(i / (data.length - 1)) * 100},${100 - ((d.value / maxValue) * 80)}`).join(' ')} vectorEffect="non-scaling-stroke" className="drop-shadow-md"/>}
           </svg>
        )}
      </div>
      {(type === 'line' || type === 'area') && <div className={`absolute bottom-0 w-full flex justify-between text-[10px] ${theme.subText} pt-2 border-t ${theme.cardBorder}`}>{data.map((d: any, i: number) => <span key={i} className="truncate w-10 text-center">{d.label}</span>)}</div>}
    </div>
  );
};

const CalendarWidget = ({ events, currentMonth, theme }: any) => {
  const [selectedDayInfo, setSelectedDayInfo] = useState<any>(null);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const today = new Date().getDate();
  
  return (
    <div className={`${theme.card} rounded-2xl shadow-sm border ${theme.cardBorder} p-4 transition-all`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-bold ${theme.text} flex items-center gap-2`}><CalendarIcon size={16} className="text-purple-500" /> Previsão ({currentMonth})</h3>
      </div>
      <div className={`grid grid-cols-7 gap-1 text-center text-xs mb-2 ${theme.subText} font-medium`}><div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div></div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = events.filter((e: any) => { const evtDate = new Date(e.date); return evtDate.getDate() === day && evtDate.getMonth() === new Date().getMonth(); });
          const hasEvents = dayEvents.length > 0;
          const isSelected = selectedDayInfo?.day === day;
          return (
            <div key={day} onClick={() => hasEvents ? setSelectedDayInfo(isSelected ? null : { day, events: dayEvents }) : setSelectedDayInfo(null)} className={`h-10 rounded-lg flex flex-col items-center justify-center relative border transition-all cursor-pointer ${isSelected ? 'bg-blue-500/20 border-blue-500 shadow-inner' : ''} ${!isSelected && hasEvents ? theme.highlight + ' ' + theme.cardBorder : 'border-transparent'} ${day === today && !isSelected ? 'bg-blue-500 text-white font-bold' : ''} ${day !== today && !isSelected ? theme.text : ''}`}>
              <span className={`text-[10px] ${hasEvents ? 'font-bold' : ''}`}>{day}</span>
              <div className="flex -space-x-1 mt-0.5">{dayEvents.map((ev: any, idx: number) => <div key={idx} className="w-2 h-2 rounded-full ring-1 ring-white" style={{ backgroundColor: ASSET_TYPES[ev.type]?.color || '#999' }} />)}</div>
            </div>
          );
        })}
      </div>
      {selectedDayInfo && (
        <div className={`mt-4 pt-3 border-t ${theme.cardBorder} animate-fade-in ${theme.highlight} rounded-lg p-2`}>
           <p className={`text-xs font-bold ${theme.text} mb-2 flex justify-between items-center`}><span>📅 Dia {selectedDayInfo.day}</span><button onClick={() => setSelectedDayInfo(null)} className={`${theme.subText} hover:text-red-500`}><X size={12}/></button></p>
           <div className="space-y-2">{selectedDayInfo.events.map((ev: any, i: number) => (<div key={i} className={`flex justify-between text-xs items-center ${theme.card} border ${theme.cardBorder} p-2 rounded shadow-sm`}><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_TYPES[ev.type]?.color }}></div><div><div className={`font-bold ${theme.text}`}>{ev.ticker}</div><div className={`text-[9px] ${theme.subText} uppercase`}>{ASSET_TYPES[ev.type]?.label}</div></div></div><span className="font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded">{ev.info}</span></div>))}</div>
        </div>
      )}
    </div>
  );
};

// --- Interfaces para Tipagem ---
interface Transaction {
  id: number;
  date: string;
  ticker: string;
  type: string;
  assetType: string;
  quantity: number;
  price: number;
  fees: number;
  broker: string;
}

interface PortfolioAsset {
  ticker: string;
  assetType: string;
  segment: string;
  quantity: number;
  totalCost: number;
  averagePrice: number;
  brokers: Set<string>;
}

export default function App() {
  // --- Estados ---
  const [currentTheme, setCurrentTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dividends, setDividends] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]); // Novo estado para favoritos
  const [currentPrices, setCurrentPrices] = useState<Record<string, any>>({}); 
  const [predictedDividends, setPredictedDividends] = useState<any[]>([]); 
  const [yearlyDividends, setYearlyDividends] = useState<Record<string, number>>({}); 
  const [newsFeed, setNewsFeed] = useState<any[]>([]); 
  
  // Estados para IR
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() - 1); 

  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  
  // Estados para Gráficos Avançados
  const [dividendView, setDividendView] = useState('monthly'); 
  const [advancedChartType, setAdvancedChartType] = useState('bar');
  const [selectedChartMonth, setSelectedChartMonth] = useState<string | null>(null); 

  const [chartType2, setChartType2] = useState('bar'); 
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isUpdatingMarket, setIsUpdatingMarket] = useState(false);
  const [isUpdatingNews, setIsUpdatingNews] = useState(false);

  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], ticker: '', type: 'COMPRA', assetType: 'ACAO', quantity: '', price: '', fees: '0.00', broker: '' });
  const [tickerSuggestions, setTickerSuggestions] = useState<any[]>([]);
  const [showTickerSuggestions, setShowTickerSuggestions] = useState(false);

  // --- Persistência ---
  useEffect(() => {
    const load = (key: string, setter: any) => { const item = localStorage.getItem(key); if(item) setter(JSON.parse(item)); };
    load('ir_theme', setCurrentTheme);
    load('ir_transactions', setTransactions);
    load('ir_dividends', setDividends);
    load('ir_prices', setCurrentPrices);
    load('ir_news_feed', setNewsFeed); 
    load('ir_predictions', setPredictedDividends);
    load('ir_yearly_dividends', setYearlyDividends);
    load('ir_favorites', setFavorites); // Carregar favoritos
  }, []);

  useEffect(() => { localStorage.setItem('ir_theme', JSON.stringify(currentTheme)); }, [currentTheme]);
  useEffect(() => { localStorage.setItem('ir_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('ir_dividends', JSON.stringify(dividends)); }, [dividends]);
  useEffect(() => { localStorage.setItem('ir_prices', JSON.stringify(currentPrices)); }, [currentPrices]);
  useEffect(() => { localStorage.setItem('ir_news_feed', JSON.stringify(newsFeed)); }, [newsFeed]);
  useEffect(() => { localStorage.setItem('ir_predictions', JSON.stringify(predictedDividends)); }, [predictedDividends]);
  useEffect(() => { localStorage.setItem('ir_yearly_dividends', JSON.stringify(yearlyDividends)); }, [yearlyDividends]);
  useEffect(() => { localStorage.setItem('ir_favorites', JSON.stringify(favorites)); }, [favorites]);

  const theme = THEMES[currentTheme];

  // --- Gemini API ---
  const callGemini = async (prompt: string, systemInstruction = "", useSearch = false) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          tools: useSearch ? [{ googleSearch: {} }] : undefined,
        },
      });
      return response.text || null;
    } catch (error) { console.error("API Error", error); return null; }
  };

  const handleUpdateMarketData = async () => {
    // Incluir tickers da carteira e favoritos
    const portfolioTickers = transactions.map(t => t.ticker);
    const tickers = [...new Set([...portfolioTickers, ...favorites])];
    
    if (tickers.length === 0) return alert("Adicione ativos ou favoritos primeiro!");
    setIsUpdatingMarket(true);
    
    const pricePrompt = `Pesquise o PREÇO ATUAL e a VARIAÇÃO DIÁRIA (%) de hoje para: ${tickers.join(', ')}. Retorne JSON (sem markdown): { "TICKER": { "price": 0.00, "change": 0.00 } }`;
    const priceRes = await callGemini(pricePrompt, "Terminal financeiro.", true);
    if (priceRes) {
      const json = cleanAndParseJSON(priceRes);
      if (json) setCurrentPrices(prev => ({ ...prev, ...json }));
    }

    // Apenas atualizar proventos para tickers da carteira
    const portfolioOnly = [...new Set(portfolioTickers)];
    if (portfolioOnly.length > 0) {
      const newsPrompt = `
        CONTEXTO: Hoje é ${new Date().toLocaleDateString('pt-BR')}.
        TAREFA: Para os ativos ${portfolioOnly.join(', ')}:
        1. Encontre 1 notícia curta.
        2. Próximo provento (Data e Valor).
        3. Soma total de proventos nos últimos 12 meses.
        
        RETORNE APENAS JSON:
        {
          "dividends": [{ "ticker": "AAA", "date": "YYYY-MM-DD", "type": "Dividendo", "value": 0.50, "info": "R$ 0,50" }],
          "yearlyTotal": { "AAA": 2.45, "BBB": 1.20 }
        }
      `;
      const newsRes = await callGemini(newsPrompt, "Analista de Proventos.", true);
      if (newsRes) {
        const json = cleanAndParseJSON(newsRes);
        if (json) {
          if(json.dividends) setPredictedDividends(json.dividends.filter((d: any) => d.value > 0));
          if(json.yearlyTotal) setYearlyDividends(prev => ({ ...prev, ...json.yearlyTotal }));
        }
      }
    }
    setIsUpdatingMarket(false);
  };

  const handleFetchNews = async () => {
    const portfolioTickers = transactions.map(t => t.ticker);
    const tickers = [...new Set([...portfolioTickers, ...favorites])];
    
    if (tickers.length === 0) return alert("Adicione ativos para buscar notícias.");
    setIsUpdatingNews(true);
    const prompt = `Pesquise notícias financeiras recentes sobre: ${tickers.join(', ')}. Retorne APENAS JSON: { "news": [{ "ticker": "PETR4", "date": "2024-05-20", "title": "Título", "summary": "Resumo", "source": "Fonte" }] }`;
    const res = await callGemini(prompt, "Agregador de notícias.", true);
    if (res) { const json = cleanAndParseJSON(res); if (json && json.news) setNewsFeed(json.news); }
    setIsUpdatingNews(false);
  };

  // --- Handlers ---
  const toggleTheme = () => {
    const themes = Object.keys(THEMES);
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setCurrentTheme(themes[nextIndex]);
  };

  const toggleFavorite = (ticker: string) => {
    const t = ticker.toUpperCase();
    if (favorites.includes(t)) {
      setFavorites(favorites.filter(f => f !== t));
    } else {
      setFavorites([...favorites, t]);
    }
  };

  const handleSmartImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    const res = await callGemini(importText, `Extraia dados da nota. Retorne JSON: { ticker, type, quantity, price, date, fees, assetType, broker }`);
    if (res) {
      const json = cleanAndParseJSON(res);
      if (json) { setForm({ ...form, ...json, fees: json.fees || '0.00', broker: json.broker || '' }); setShowImportModal(false); setImportText(''); alert("Preenchido!"); }
      else alert("Erro ao interpretar.");
    }
    setIsImporting(false);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const newT: Transaction = { 
      ...form, 
      id: Date.now(), 
      ticker: form.ticker.toUpperCase(), 
      quantity: Number(form.quantity), 
      price: Number(form.price), 
      fees: Number(form.fees||0),
      date: form.date,
      type: form.type,
      assetType: form.assetType,
      broker: form.broker
    };
    setTransactions([...transactions, newT].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setForm({ ...form, ticker: '', quantity: '', price: '', fees: '0.00' });
  };
  
  const removeTransaction = (id: number) => { if(confirm("Apagar?")) setTransactions(transactions.filter(t => t.id !== id)); };
  
  const handleSellAsset = (ticker: string) => {
      setForm({ ...form, ticker: ticker, type: 'VENDA', date: new Date().toISOString().split('T')[0] });
      setActiveTab('transactions');
  };

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setForm({ ...form, ticker: value });
    if (value.length > 0) {
      const filtered = B3_ASSETS.filter(a => a.t.startsWith(value) || a.n.toUpperCase().includes(value)).sort((a, b) => { const aStarts = a.t.startsWith(value); const bStarts = b.t.startsWith(value); if (aStarts && !bStarts) return -1; if (!aStarts && bStarts) return 1; return 0; }).slice(0, 30);
      setTickerSuggestions(filtered); setShowTickerSuggestions(true);
    } else { setShowTickerSuggestions(false); }
  };

  const selectTicker = (asset: any) => { setForm({ ...form, ticker: asset.t, assetType: asset.type || 'ACAO' }); setShowTickerSuggestions(false); };

  // --- CÁLCULOS ---
  const { portfolio, totalPatrimony, totalCost, chartData, irReport, advancedDividends, topPayers, dividendsDetail } = useMemo(() => {
    const port: Record<string, PortfolioAsset> = {}; 
    const mResults: Record<string, any> = {}; 
    const irPort: Record<string, PortfolioAsset> = {};
    const irMonthlySummary: Record<string, any> = {}; 
    
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTransactions.forEach(t => {
      const ym = t.date.substring(0, 7);
      if(!mResults[ym]) mResults[ym] = { totalSales: 0, profits: { ACAO: 0, FII: 0, ETF: 0, BDR: 0, CRIPTO: 0 } };
      
      const assetInfo = (B3_ASSETS.find(a => a.t === t.ticker) || {}) as any;
      const segment = assetInfo.s || 'Outros';

      if(!port[t.ticker]) port[t.ticker] = { ticker: t.ticker, assetType: t.assetType, segment, quantity: 0, totalCost: 0, averagePrice: 0, brokers: new Set() };
      const asset = port[t.ticker]; if(t.broker) asset.brokers.add(t.broker);
      
      if(t.type === 'COMPRA') { 
          asset.totalCost += (t.quantity * t.price) + t.fees; 
          asset.quantity += t.quantity; 
          asset.averagePrice = asset.totalCost / asset.quantity; 
      } else { 
          const saleVal = (t.quantity * t.price) - t.fees; 
          const costBasis = t.quantity * asset.averagePrice; 
          asset.totalCost -= costBasis; 
          asset.quantity -= t.quantity; 
          if(asset.quantity <= 0) { asset.quantity = 0; asset.totalCost = 0; asset.averagePrice = 0; } 
          mResults[ym].profits[t.assetType as keyof typeof mResults[typeof ym]['profits']] += (saleVal - costBasis); 
          if(t.assetType === 'ACAO') mResults[ym].totalSales += saleVal; 
      }

      const transDate = new Date(t.date); const cutoffDate = new Date(`${selectedYear}-12-31`);
      if (transDate <= cutoffDate) {
          // fix: add segment to irPort initialization
          if(!irPort[t.ticker]) irPort[t.ticker] = { ticker: t.ticker, assetType: t.assetType, segment, quantity: 0, totalCost: 0, averagePrice: 0, brokers: new Set() };
          const irAsset = irPort[t.ticker]; if(t.broker) irAsset.brokers.add(t.broker);
          
          if(t.type === 'COMPRA') { 
             irAsset.totalCost += (t.quantity * t.price) + t.fees; 
             irAsset.quantity += t.quantity; 
             irAsset.averagePrice = irAsset.totalCost / irAsset.quantity; 
          } else { 
             const costBasis = t.quantity * irAsset.averagePrice;
             irAsset.totalCost -= costBasis;
             irAsset.quantity -= t.quantity;
             if(irAsset.quantity <= 0) { irAsset.quantity = 0; irAsset.totalCost = 0; irAsset.averagePrice = 0; } 
          }
      }

      if (transDate.getFullYear() === selectedYear) {
          if(!irMonthlySummary[ym]) irMonthlySummary[ym] = { sales: { ACAO: 0, FII: 0, ETF: 0 } as Record<string, number>, profit: { ACAO: 0, FII: 0, ETF: 0 } as Record<string, number>, tax: 0 };
          if(t.type === 'VENDA') {
             const saleValue = (t.quantity * t.price) - t.fees;
             const cost = t.quantity * asset.averagePrice; 
             const result = saleValue - cost;
             // fix: address arithmetic operation error by casting to number explicitly
             irMonthlySummary[ym].sales[t.assetType] = (Number(irMonthlySummary[ym].sales[t.assetType]) || 0) + saleValue;
             irMonthlySummary[ym].profit[t.assetType] = (Number(irMonthlySummary[ym].profit[t.assetType]) || 0) + result;
          }
      }
    });

    Object.keys(irMonthlySummary).forEach(ym => {
        const data = irMonthlySummary[ym];
        let tax = 0;
        if (data.sales.ACAO >= 20000 && data.profit.ACAO > 0) tax += data.profit.ACAO * 0.15;
        if (data.profit.FII > 0) tax += data.profit.FII * 0.20;
        if (data.profit.ETF > 0) tax += data.profit.ETF * 0.15;
        data.tax = tax;
    });

    let tPat = 0, tCost = 0;
    const activeAssets = Object.values(port).filter(a => a.quantity > 0);
    const divsByMonth: Record<string, number> = {}; dividends.forEach(d => { const ym = d.date.substring(0, 7); divsByMonth[ym] = (divsByMonth[ym] || 0) + d.value; });
    const chartDivsByMonth = []; const today = new Date(); for (let i = 5; i >= 0; i--) { const d = new Date(today.getFullYear(), today.getMonth() - i, 1); const ym = d.toISOString().substring(0, 7); const [y, m] = ym.split('-'); chartDivsByMonth.push({ label: `${MONTHS[parseInt(m)-1].substring(0,3)}`, value: divsByMonth[ym] || 0 }); }

    const segmentMap: Record<string, number> = {}; activeAssets.forEach(a => { const currentPrice = currentPrices[a.ticker]?.price || a.averagePrice; const totalValue = a.quantity * currentPrice; segmentMap[a.segment] = (segmentMap[a.segment] || 0) + totalValue; });
    const chartSegments = Object.keys(segmentMap).map(s => ({ label: s, value: segmentMap[s] })).sort((a,b) => b.value - a.value);
    const classMap: Record<string, number> = {}; activeAssets.forEach(a => { const currentPrice = currentPrices[a.ticker]?.price || a.averagePrice; const totalValue = a.quantity * currentPrice; const className = ASSET_TYPES[a.assetType]?.label || 'Outros'; classMap[className] = (classMap[className] || 0) + totalValue; });
    const chartClasses = Object.keys(classMap).map(s => ({ label: s, value: classMap[s] })).sort((a,b) => b.value - a.value);
    const chartTopAssets = activeAssets.map(a => { const currentPrice = currentPrices[a.ticker]?.price || a.averagePrice; return { label: a.ticker, value: a.quantity * currentPrice }; });
    const chartDivsByAsset = activeAssets.map(asset => { const aiValuePerShare = yearlyDividends[asset.ticker] || 0; const totalAI = aiValuePerShare * asset.quantity; return { label: asset.ticker, value: totalAI, isEstimate: aiValuePerShare > 0 }; }).filter(d => d.value > 0);
    const chartProfitability = activeAssets.map(a => { const currPrice = currentPrices[a.ticker]?.price || a.averagePrice; const prof = ((currPrice / a.averagePrice) - 1) * 100; return { label: a.ticker, value: prof }; });
    activeAssets.forEach(a => { tCost += a.totalCost; const price = currentPrices[a.ticker]?.price || a.averagePrice; tPat += a.quantity * price; });

    const allDividends = [...dividends];
    predictedDividends.forEach(p => {
        const asset = port[p.ticker];
        const qty = asset ? asset.quantity : 0;
        if (qty > 0) {
            const exists = dividends.some(d => d.ticker === p.ticker && d.date === p.date);
            if (!exists) {
                allDividends.push({ ticker: p.ticker, date: p.date, value: p.value * qty, isPredicted: true });
            }
        }
    });

    const divsGrouped: { monthly: Record<string, number>, yearly: Record<string, number>, byAsset: Record<string, number>, details: Record<string, any[]> } = { monthly: {}, yearly: {}, byAsset: {}, details: {} };
    
    allDividends.forEach(d => {
        const mKey = d.date.substring(0, 7); 
        const yKey = d.date.substring(0, 4); 
        divsGrouped.monthly[mKey] = (divsGrouped.monthly[mKey] || 0) + d.value;
        divsGrouped.yearly[yKey] = (divsGrouped.yearly[yKey] || 0) + d.value;
        divsGrouped.byAsset[d.ticker] = (divsGrouped.byAsset[d.ticker] || 0) + d.value;
        if (!divsGrouped.details[mKey]) divsGrouped.details[mKey] = [];
        divsGrouped.details[mKey].push(d);
    });

    const getInvestedCapitalAtDate = (dateStr: string) => {
        return transactions.filter(t => t.date <= dateStr && t.type === 'COMPRA').reduce((acc, t) => acc + (t.quantity * t.price) + t.fees, 0) - transactions.filter(t => t.date <= dateStr && t.type === 'VENDA').reduce((acc, t) => acc + (t.quantity * t.price) - t.fees, 0); 
    };

    const advancedChartData = Object.keys(divsGrouped[dividendView as keyof typeof divsGrouped]).sort().map(key => {
        const endDate = dividendView === 'monthly' ? `${key}-31` : `${key}-12-31`;
        const invested = getInvestedCapitalAtDate(endDate);
        const value = divsGrouped[dividendView as keyof typeof divsGrouped][key];
        const yieldVal = invested > 0 ? (value / invested) * 100 : 0;
        return { label: dividendView === 'monthly' ? formatDate(`${key}-01`).substring(3) : key, originalKey: key, value: value, yield: yieldVal, invested: invested, details: true };
    });
    
    const topPayers = Object.entries(divsGrouped.byAsset).map(([ticker, value]) => ({ ticker, value })).sort((a, b) => b.value - a.value);

    return { portfolio: port, monthlyResults: mResults, totalPatrimony: tPat, totalCost: tCost, chartData: { divsByAsset: chartDivsByAsset, divsByMonth: chartDivsByMonth, profitability: chartProfitability, segments: chartSegments, classes: chartClasses, topAssets: chartTopAssets }, irReport: { portfolio: irPort, monthlySummary: irMonthlySummary }, advancedDividends: advancedChartData, topPayers, dividendsDetail: divsGrouped.details };
  }, [transactions, currentPrices, dividends, predictedDividends, yearlyDividends, selectedYear, dividendView]); 

  // --- Relatórios ---
  // fix: implement downloadCSV function
  const downloadCSV = () => {
    const headers = ["Ticker", "Tipo", "Quantidade", "Custo Total", "Preço Médio"];
    const rows = Object.values(irReport.portfolio)
      .filter((a: any) => a.quantity > 0)
      .map((a: any) => [
        a.ticker,
        ASSET_TYPES[a.assetType]?.label || a.assetType,
        a.quantity,
        a.totalCost.toFixed(2),
        a.averagePrice.toFixed(2)
      ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_ir_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // fix: implement printReport function
  const printReport = () => {
    window.print();
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); alert('Copiado!'); };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans pb-20 selection:bg-purple-200 transition-colors duration-300`}>
      <nav className={`${theme.nav} border-b ${theme.cardBorder} sticky top-0 z-40 backdrop-blur-md`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-2 rounded-lg shadow-lg shadow-blue-500/20"><TrendingUp size={20} /></div><div><h1 className={`text-xl font-bold tracking-tight ${theme.text} leading-none`}>Invest<span className="text-blue-500">Pro</span></h1><span className={`text-[10px] ${theme.subText} font-medium uppercase tracking-widest`}>Terminal Inteligente</span></div></div>
          <div className={`hidden md:flex items-center gap-1 ${theme.highlight} p-1 rounded-xl`}>{[{ id: 'dashboard', label: 'Mercado', icon: BarChart3 }, { id: 'favorites', label: 'Favoritos', icon: Star }, { id: 'charts', label: 'Gráficos', icon: PieChart }, { id: 'news', label: 'Notícias', icon: Newspaper }, { id: 'transactions', label: 'Lançamentos', icon: Plus }, { id: 'report', label: 'Relatório IR', icon: FileText }].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id ? `${theme.card} ${theme.text} shadow-sm ring-1 ring-black/5` : `${theme.subText} hover:${theme.text} hover:bg-white/10`}`}><tab.icon size={16} />{tab.label}</button>))}</div>
          <div className="flex items-center gap-2"><button onClick={toggleTheme} className={`p-2 rounded-full ${theme.highlight} ${theme.text} hover:opacity-80 transition-all`} title={`Tema: ${theme.name}`}><theme.icon size={16}/></button><button onClick={handleUpdateMarketData} disabled={isUpdatingMarket} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isUpdatingMarket ? 'opacity-50' : ''} ${theme.highlight} ${theme.accent} ${theme.cardBorder}`}>{isUpdatingMarket ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}<span className="hidden sm:inline">Atualizar</span></button></div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto mt-8 px-4">
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Patrimônio Estimado" value={formatCurrency(totalPatrimony)} icon={Wallet} trend={totalPatrimony >= totalCost ? 'up' : 'down'} subtext={`${totalPatrimony >= totalCost ? '+' : ''}${formatCurrency(totalPatrimony - totalCost)} vs Custo`} theme={theme} />
              <StatCard title="Custo de Aquisição" value={formatCurrency(totalCost)} icon={DollarSign} trend="neutral" subtext="Total investido" theme={theme} />
              <StatCard title="Rentabilidade Carteira" value={totalCost > 0 ? `${((totalPatrimony / totalCost - 1) * 100).toFixed(2)}%` : '0.00%'} icon={TrendingUp} trend={totalPatrimony >= totalCost ? 'up' : 'down'} subtext="Baseado no preço atual vs PM" theme={theme} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 space-y-4">
                  <div className={`${theme.card} rounded-2xl shadow-sm border ${theme.cardBorder} overflow-hidden`}>
                    <div className={`p-5 border-b ${theme.cardBorder} flex justify-between items-center ${theme.highlight}`}><h3 className={`font-bold ${theme.text} flex items-center gap-2`}><Search size={16} className="text-blue-500" /> Monitoramento</h3><span className={`text-[10px] ${theme.subText} px-2 py-1 rounded-full border ${theme.cardBorder}`}>Atualizado via Google</span></div>
                    <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className={`${theme.highlight} ${theme.subText} uppercase text-[10px] font-semibold tracking-wider`}><tr><th className="px-5 py-3">Ativo</th><th className="px-5 py-3">Segmento</th><th className="px-5 py-3 text-right">Preço Atual</th><th className="px-5 py-3 text-right">Var. Dia</th><th className="px-5 py-3 text-right">Preço Médio</th><th className="px-5 py-3 text-right">Rentab.</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3 text-center">Ações</th></tr></thead><tbody className={`divide-y ${theme.cardBorder}`}>{Object.values(portfolio).filter(a => a.quantity > 0).map(asset => { const liveData = currentPrices[asset.ticker] || {}; const price = liveData.price || asset.averagePrice; const change = liveData.change || 0; const profitability = ((price / asset.averagePrice) - 1) * 100; return (<tr key={asset.ticker} className={`hover:${theme.highlight} transition-colors group`}><td className="px-5 py-4"><div className={`font-bold ${theme.text}`}>{asset.ticker}</div><div className={`text-[10px] ${theme.subText}`}>{ASSET_TYPES[asset.assetType]?.label} • {asset.quantity} un.</div></td><td className={`px-5 py-4 text-xs ${theme.subText}`}>{asset.segment}</td><td className={`px-5 py-4 text-right font-medium ${theme.text}`}>{formatCurrency(price)}</td><td className="px-5 py-4 text-right"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${change >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{change > 0 ? <ArrowUpRight size={12} className="mr-1"/> : <ArrowDownRight size={12} className="mr-1"/>}{change}%</span></td><td className={`px-5 py-4 text-right ${theme.subText}`}>{formatCurrency(asset.averagePrice)}</td><td className={`px-5 py-4 text-right font-bold ${profitability >= 0 ? 'text-green-500' : 'text-red-500'}`}>{profitability > 0 ? '+' : ''}{profitability.toFixed(2)}%</td><td className={`px-5 py-4 text-right font-bold ${theme.text}`}>{formatCurrency(asset.quantity * price)}</td><td className="px-5 py-4 text-center"><button onClick={() => handleSellAsset(asset.ticker)} className={`p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-semibold`}>Vender</button></td></tr>) })}</tbody></table></div>
                  </div>
               </div>
               <div className="space-y-6">
                 <CalendarWidget currentMonth={MONTHS[new Date().getMonth()]} events={predictedDividends.map(d => ({ ...d, type: portfolio[d.ticker]?.assetType || 'ACAO' }))} theme={theme} />
               </div>
            </div>
          </div>
        )}

        {/* ABA FAVORITOS */}
        {activeTab === 'favorites' && (
          <div className="animate-fade-in space-y-6">
             <div className="flex items-center justify-between mb-4">
               <div>
                 <h2 className={`text-xl font-bold ${theme.text} flex items-center gap-2`}>
                   <Star size={24} className="text-yellow-500 fill-yellow-500"/> Meus Favoritos
                 </h2>
                 <p className={`text-xs ${theme.subText} mt-1`}>Monitore ativos de interesse e oportunidades de mercado</p>
               </div>
               <div className="relative w-full max-w-xs group">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition-colors">
                   <Search size={16} />
                 </div>
                 <input 
                    type="text" 
                    placeholder="Adicionar ticker (ex: WEGE3)" 
                    className={`w-full pl-10 pr-4 py-2 ${theme.input} rounded-xl text-sm outline-none transition-all`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.toUpperCase().trim();
                        if (val && !favorites.includes(val)) {
                          toggleFavorite(val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                 />
               </div>
             </div>

             {favorites.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {favorites.map(ticker => {
                   const data = currentPrices[ticker] || { price: 0, change: 0 };
                   const assetInfo = B3_ASSETS.find(a => a.t === ticker);
                   return (
                     <div key={ticker} className={`${theme.card} border ${theme.cardBorder} p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`font-bold text-lg ${theme.text}`}>{ticker}</h3>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${theme.highlight} ${theme.subText} font-bold`}>
                                {assetInfo?.type || 'ATIVO'}
                              </span>
                            </div>
                            <p className={`text-[10px] ${theme.subText} truncate max-w-[140px]`}>{assetInfo?.n || 'Empresa Monitorada'}</p>
                          </div>
                          <button onClick={() => toggleFavorite(ticker)} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-end">
                          <div>
                            <div className={`text-xl font-bold ${theme.text}`}>{data.price > 0 ? formatCurrency(data.price) : '---'}</div>
                            <div className={`text-[10px] font-medium flex items-center gap-1 mt-1 ${data.change >= 0 ? theme.success : theme.danger}`}>
                              {data.change > 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                              {data.change.toFixed(2)}% hoje
                            </div>
                          </div>
                          <div className={`p-2 rounded-lg ${theme.highlight} opacity-20 group-hover:opacity-100 transition-opacity`}>
                            <Eye size={18} className={theme.accent} />
                          </div>
                        </div>
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className={`text-center py-20 ${theme.card} border ${theme.cardBorder} rounded-3xl border-dashed`}>
                 <div className={`w-16 h-16 ${theme.highlight} rounded-full flex items-center justify-center mx-auto mb-4`}>
                   <Star size={32} className="text-gray-400" />
                 </div>
                 <h3 className={`font-bold ${theme.text}`}>Sua watchlist está vazia</h3>
                 <p className={`text-sm ${theme.subText} mt-1 max-w-xs mx-auto`}>Adicione ativos que você deseja monitorar mas ainda não possui na carteira.</p>
               </div>
             )}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="animate-fade-in space-y-6">
             <div className="flex items-center justify-between mb-4">
               <div><h2 className={`text-xl font-bold ${theme.text} flex items-center gap-2`}><Newspaper size={24} className="text-blue-500"/> Notícias de Mercado</h2><p className={`text-xs ${theme.subText} mt-1`}>Fatos relevantes e atualizações dos seus ativos</p></div>
               <button onClick={handleFetchNews} disabled={isUpdatingNews} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${isUpdatingNews ? 'opacity-50' : ''} ${theme.button}`}>{isUpdatingNews ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Atualizar Agora</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsFeed.length > 0 ? newsFeed.map((newsItem, index) => (<div key={index} className={`${theme.card} p-5 rounded-2xl border ${theme.cardBorder} shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}><div><div className="flex justify-between items-start mb-3"><span className={`text-[10px] font-bold ${theme.highlight} ${theme.text} px-2 py-1 rounded uppercase tracking-wide`}>{newsItem.ticker}</span><span className={`text-[10px] ${theme.subText} flex items-center gap-1`}><CalendarIcon size={12}/> {formatDate(newsItem.date)}</span></div><h3 className={`font-bold ${theme.text} mb-2 leading-snug line-clamp-2`}>{newsItem.title}</h3><p className={`text-sm ${theme.subText} line-clamp-4 leading-relaxed`}>{newsItem.summary}</p></div><div className={`mt-4 pt-3 border-t ${theme.cardBorder} flex justify-between items-center text-[10px] ${theme.subText}`}><span className="font-semibold">Fonte: {newsItem.source || 'Mercado'}</span></div></div>)) : (<div className="col-span-full py-16 text-center"><div className={`w-16 h-16 ${theme.highlight} rounded-full flex items-center justify-center mx-auto mb-4`}><Newspaper size={32} className={theme.subText} /></div><p className={`${theme.text} font-medium`}>Nenhuma notícia carregada.</p><p className={`text-sm ${theme.subText} mt-1`}>Clique em "Atualizar Agora" para a IA buscar os destaques dos seus ativos.</p></div>)}
             </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="animate-fade-in space-y-6">
             <div className="flex items-center justify-between mb-2"><h2 className={`text-xl font-bold ${theme.text}`}>Análise Gráfica</h2><div className={`text-xs ${theme.subText} ${theme.card} px-3 py-1 rounded-full border ${theme.cardBorder} shadow-sm`}>Dados baseados nos lançamentos e cotações atuais</div></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className={`${theme.card} p-6 rounded-2xl shadow-sm border ${theme.cardBorder} md:col-span-2 relative group`}>
                  <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                     <div><h3 className={`font-bold ${theme.text} flex items-center gap-2`}><BarChart3 size={18} className="text-purple-500" /> Proventos Recebidos</h3><p className={`text-xs ${theme.subText} mt-1`}>Baseado na <strong>Data de Anúncio (Com)</strong>.</p></div>
                     <div className="flex gap-2 self-end md:self-auto"><div className={`flex ${theme.highlight} rounded-lg p-0.5`}>{[{ id: 'monthly', label: 'Mensal' }, { id: 'yearly', label: 'Anual' }].map(t => (<button key={t.id} onClick={() => { setDividendView(t.id); setSelectedChartMonth(null); }} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${dividendView === t.id ? `${theme.card} shadow text-purple-500` : `${theme.subText} hover:text-purple-500`}`}>{t.label}</button>))}</div><div className={`flex ${theme.highlight} rounded-lg p-0.5`}>{[{ id: 'bar', icon: BarChart3 }, { id: 'line', icon: Activity }, { id: 'area', icon: Layers }].map(t => (<button key={t.id} onClick={() => setAdvancedChartType(t.id)} className={`p-1.5 rounded-md transition-all ${advancedChartType === t.id ? `${theme.card} shadow text-purple-500` : `${theme.subText} hover:text-purple-500`}`}><t.icon size={14} /></button>))}</div></div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                          <FlexibleChart data={advancedDividends} type={advancedChartType} color="#8b5cf6" height={250} formatValue={formatCurrency} theme={theme} onSliceClick={(item: any) => setSelectedChartMonth(item.originalKey)} />
                      </div>
                      <div className={`w-full md:w-1/3 border-l ${theme.cardBorder} pl-0 md:pl-6`}>
                          {selectedChartMonth && dividendsDetail[selectedChartMonth] ? (
                              <div className="animate-fade-in">
                                  <h4 className={`text-xs font-bold ${theme.text} mb-3 uppercase tracking-wider flex justify-between`}>
                                      <span>Detalhes: {selectedChartMonth}</span>
                                      <button onClick={() => setSelectedChartMonth(null)}><X size={12}/></button>
                                  </h4>
                                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                                      {dividendsDetail[selectedChartMonth].map((d, idx) => (
                                          <div key={idx} className={`flex justify-between items-center text-xs p-2 rounded ${theme.highlight} bg-opacity-50 hover:bg-opacity-100 transition-colors`}>
                                              <span className={`font-semibold ${theme.text}`}>{d.ticker}</span>
                                              <div className="text-right"><span className="block font-mono font-bold text-green-600">{formatCurrency(d.value)}</span><span className={`text-[9px] ${theme.subText}`}>{formatDate(d.date)}</span></div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ) : (
                              <>
                                <h4 className={`text-xs font-bold ${theme.text} mb-3 uppercase tracking-wider`}>Ranking Geral</h4>
                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                                    {topPayers.length > 0 ? (topPayers.map((item, idx) => (<div key={idx} className={`flex justify-between items-center text-xs p-2 rounded ${theme.highlight} bg-opacity-50 hover:bg-opacity-100 transition-colors`}><div className="flex items-center gap-2"><span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white`} style={{ backgroundColor: ASSET_TYPES[portfolio[item.ticker]?.assetType]?.color || '#999' }}>{idx + 1}</span><span className={`font-semibold ${theme.text}`}>{item.ticker}</span></div><span className="font-mono font-bold text-green-600">{formatCurrency(item.value)}</span></div>))) : (<p className={`text-xs ${theme.subText} text-center py-4`}>Sem dados.</p>)}
                                </div>
                              </>
                          )}
                      </div>
                  </div>
               </div>
               <div className={`${theme.card} p-6 rounded-2xl shadow-sm border ${theme.cardBorder} md:col-span-2`}><div className="flex justify-between items-start mb-6"><div><h3 className={`font-bold ${theme.text} flex items-center gap-2`}><Briefcase size={18} className="text-orange-500" /> Exposição por Segmento</h3><p className={`text-xs ${theme.subText} mt-1`}>Clique nas fatias para ver os ativos</p></div></div><div className="flex flex-col md:flex-row items-center gap-8"><div className="flex-1 w-full"><FlexibleChart data={chartData.segments} type="donut" color="#f97316" height={260} formatValue={formatCurrency} onSliceClick={(item: any) => setSelectedSegment(item.label === selectedSegment ? null : item.label)} theme={theme} /></div>{selectedSegment && (<div className={`w-full md:w-1/3 bg-orange-500/10 rounded-xl p-4 border border-orange-500/20 animate-fade-in`}><h4 className="font-bold text-orange-600 text-sm mb-3 flex items-center gap-2"><List size={14}/> Ativos em: {selectedSegment}</h4><div className="space-y-2 max-h-40 overflow-y-auto">{Object.values(portfolio).filter(a => a.segment === selectedSegment && a.quantity > 0).map(a => (<div key={a.ticker} className={`flex justify-between text-xs ${theme.card} p-2 rounded shadow-sm`}><span className={`font-bold ${theme.text}`}>{a.ticker}</span><span className={theme.subText}>{formatCurrency(a.quantity * (currentPrices[a.ticker]?.price || a.averagePrice))}</span></div>))}</div></div>)}</div></div>
               <div className={`${theme.card} p-6 rounded-2xl shadow-sm border ${theme.cardBorder}`}><div className="flex justify-between items-start mb-6"><div><h3 className={`font-bold ${theme.text} flex items-center gap-2`}><PieChart size={18} className="text-blue-500" /> Alocação por Classe</h3></div></div><FlexibleChart data={chartData.classes} type="donut" color="#3b82f6" height={220} formatValue={formatCurrency} onSliceClick={() => {}} theme={theme} /></div>
               <div className={`${theme.card} p-6 rounded-2xl shadow-sm border ${theme.cardBorder}`}><div className="flex justify-between items-start mb-6"><div><h3 className={`font-bold ${theme.text} flex items-center gap-2`}><Layers size={18} className="text-indigo-500" /> Top 5 Maiores Posições</h3></div></div><FlexibleChart data={chartData.topAssets} type="bar-horizontal" color="#6366f1" height={220} formatValue={formatCurrency} onSliceClick={() => {}} theme={theme} /></div>
               <div className={`${theme.card} p-6 rounded-2xl shadow-sm border ${theme.cardBorder}`}><div className="flex justify-between items-start mb-6"><div><h3 className={`font-bold ${theme.text} flex items-center gap-2`}><TrendingUp size={18} className="text-blue-500" /> Rentabilidade por Ativo</h3><p className={`text-xs ${theme.subText} mt-1`}>Comparativo % (Preço Atual vs Preço Médio)</p></div><div className={`flex ${theme.highlight} rounded-lg p-0.5`}>{[{ id: 'bar', icon: BarChart3 }, { id: 'line', icon: Activity }, { id: 'pie', icon: PieChart }].map(t => (<button key={t.id} onClick={() => setChartType2(t.id as any)} className={`p-1.5 rounded-md transition-all ${chartType2 === t.id ? `${theme.card} shadow text-blue-500` : `${theme.subText} hover:text-blue-500`}`}><t.icon size={14} /></button>))}</div></div><FlexibleChart data={chartData.profitability} type={chartType2} color="#3b82f6" height={220} formatValue={(v: any) => `${v.toFixed(2)}%`} onSliceClick={() => {}} theme={theme} /></div>
             </div>
          </div>
        )}

        {/* LANÇAMENTOS */}
        {activeTab === 'transactions' && (
           <div className={`animate-fade-in ${theme.card} rounded-2xl shadow-sm border ${theme.cardBorder} p-6 relative`}>
              <div className="flex justify-between items-center mb-6"><h2 className={`text-lg font-bold ${theme.text}`}>Lançamentos</h2><button onClick={() => setShowImportModal(true)} className={`text-xs bg-purple-500/10 text-purple-600 px-3 py-1.5 rounded-full flex items-center gap-1 font-semibold border border-purple-500/20 hover:bg-purple-500/20 transition-colors`}><Sparkles size={14} /> Importar com IA</button></div>
              <form onSubmit={handleAddTransaction} className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                <div className="col-span-2 md:col-span-1 space-y-1"><label className={`text-[10px] font-bold ${theme.subText} uppercase tracking-wider`}>Data</label><input type="date" required className={`w-full p-2.5 ${theme.input} rounded-lg text-sm outline-none`} value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
                <div className="col-span-2 md:col-span-1 space-y-1 relative"><label className={`text-[10px] font-bold ${theme.subText} uppercase tracking-wider`}>Ativo</label><input type="text" required placeholder="PETR4 ou Petrobras" className={`w-full p-2.5 ${theme.input} rounded-lg text-sm uppercase outline-none`} value={form.ticker} onChange={handleTickerChange} onBlur={() => setTimeout(() => setShowTickerSuggestions(false), 200)} />{showTickerSuggestions && tickerSuggestions.length > 0 && (<ul className={`absolute z-50 w-full ${theme.card} border ${theme.cardBorder} rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto animate-fade-in`}>{tickerSuggestions.map((asset, i) => (<li key={i} onClick={() => selectTicker(asset)} className={`px-3 py-2 hover:${theme.highlight} cursor-pointer text-sm flex justify-between items-center border-b ${theme.cardBorder} last:border-0`}><div><span className={`font-bold ${theme.text} block`}>{asset.t}</span><span className={`text-[10px] ${theme.subText}`}>{asset.n}</span></div><span className={`text-[9px] ${theme.highlight} ${theme.subText} px-1.5 py-0.5 rounded`}>{asset.type || 'ACAO'}</span></li>))}</ul>)}</div>
                <div className="col-span-2 md:col-span-1 space-y-1"><label className={`text-[10px] font-bold ${theme.subText} uppercase tracking-wider`}>Corretora</label><select className={`w-full p-2.5 ${theme.input} rounded-lg text-sm outline-none`} value={form.broker} onChange={e => setForm({...form, broker: e.target.value})}><option value="">Selecione...</option>{BROKERS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                <div className="col-span-2 md:col-span-1 space-y-1"><label className={`text-[10px] font-bold ${theme.subText} uppercase tracking-wider`}>Operação</label><select className={`w-full p-2.5 ${theme.input} rounded-lg text-sm outline-none`} value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option value="COMPRA">Compra</option><option value="VENDA">Venda</option></select></div>
                <div className="col-span-2 md:col-span-1 space-y-1"><label className={`text-[10px] font-bold ${theme.subText} uppercase tracking-wider`}>Qtd</label><input type="number" required className={`w-full p-2.5 ${theme.input} rounded-lg text-sm outline-none`} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} /></div>
                <div className="col-span-2 md:col-span-1 space-y-1"><label className={`text-[10px] font-bold ${theme.subText} uppercase tracking-wider`}>Preço (R$)</label><input type="number" step="0.01" required className={`w-full p-2.5 ${theme.input} rounded-lg text-sm outline-none`} value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
                <div className="col-span-2 md:col-span-1 space-y-1"><label className={`text-[10px] font-bold ${theme.subText} uppercase tracking-wider`}>Taxas (R$)</label><input type="number" step="0.01" className={`w-full p-2.5 ${theme.input} rounded-lg text-sm outline-none`} value={form.fees} onChange={e => setForm({...form, fees: e.target.value})} /></div>
                <div className="col-span-2 md:col-span-1 flex items-end"><button type="submit" className={`w-full ${theme.button} p-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg flex justify-center items-center gap-2`}><Save size={16} /> Salvar</button></div>
              </form>
              <div className={`mb-8 border-t ${theme.cardBorder} pt-6`}><h3 className="text-sm font-bold text-green-500 mb-4 flex items-center gap-2"><DollarSign size={16}/> Registrar Recebimento Manual (Data de Anúncio)</h3><div className="flex gap-2 items-end"><div className="flex-1"><label className={`text-[9px] font-bold ${theme.subText} uppercase`}>Data Anúncio (Com)</label><input type="date" className={`w-full border rounded p-2 text-sm ${theme.input}`} id="divDate" defaultValue={new Date().toISOString().split('T')[0]} /></div><input type="text" placeholder="Ativo" className={`border rounded p-2 text-sm uppercase w-24 ${theme.input}`} id="divTicker" /><input type="number" placeholder="Valor R$" step="0.01" className={`border rounded p-2 text-sm w-32 ${theme.input}`} id="divValue" /><button onClick={() => { const d = (document.getElementById('divDate') as HTMLInputElement).value; const t = (document.getElementById('divTicker') as HTMLInputElement).value.toUpperCase(); const v = Number((document.getElementById('divValue') as HTMLInputElement).value); if(t && v) { setDividends([...dividends, {id: Date.now(), date: d, ticker: t, value: v}]); (document.getElementById('divTicker') as HTMLInputElement).value = ''; (document.getElementById('divValue') as HTMLInputElement).value = ''; alert('Provento registrado!'); } }} className="bg-green-600 text-white p-2 rounded hover:bg-green-700 text-sm h-[38px] mt-auto">Adicionar</button></div></div>
              <div className={`border-t ${theme.cardBorder} pt-6`}><h3 className={`text-xs font-bold ${theme.subText} uppercase tracking-wider mb-4`}>Histórico Recente</h3><div className="space-y-2">{transactions.slice().reverse().map((t) => (<div key={t.id} className={`flex items-center justify-between p-3 hover:${theme.highlight} rounded-lg transition-colors border border-transparent hover:${theme.cardBorder} group`}><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${t.type === 'COMPRA' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>{t.type === 'COMPRA' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}</div><div><div className={`font-bold text-sm ${theme.text}`}>{t.ticker}</div><div className={`text-[10px] ${theme.subText}`}>{formatDate(t.date)} • {t.broker}</div></div></div><div className="text-right"><div className={`font-mono font-medium text-sm ${theme.text}`}>{formatCurrency((t.quantity * t.price) + t.fees)}</div><div className={`text-[10px] ${theme.subText}`}>{t.quantity}un x {formatCurrency(t.price)}</div></div><button onClick={() => removeTransaction(t.id)} className={`opacity-0 group-hover:opacity-100 p-2 ${theme.subText} hover:text-red-500 transition-all`}><Trash2 size={16} /></button></div>))}</div></div>
           </div>
        )}

        {/* RELATÓRIO IR */}
        {activeTab === 'report' && (
          <div className="animate-fade-in space-y-8">
            <div className={`bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-4 shadow-sm`}>
               <div className="bg-amber-500 text-white p-2 rounded-lg shrink-0"><AlertTriangle size={24} /></div>
               <div><h3 className="text-amber-600 font-bold text-lg">Ano Fiscal: {selectedYear}</h3><p className={`text-sm ${theme.subText} mt-1`}>Posição consolidada para <strong>31/12/{selectedYear}</strong>. O relatório abaixo separa lucros isentos de tributáveis para facilitar sua declaração.</p></div>
               <div className="ml-auto"><select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className={`p-2 rounded-lg border ${theme.cardBorder} ${theme.card} ${theme.text} text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer`}>{[2022, 2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select></div>
            </div>

            <div className="flex gap-4">
                <button onClick={downloadCSV} className={`flex items-center gap-2 ${theme.button} px-4 py-2 rounded-lg shadow-sm font-semibold`}><Download size={16} /> Exportar CSV</button>
                <button onClick={printReport} className={`flex items-center gap-2 ${theme.card} ${theme.text} border ${theme.cardBorder} px-4 py-2 rounded-lg shadow-sm font-semibold hover:${theme.highlight}`}><Printer size={16} /> Imprimir / PDF</button>
            </div>

            <section>
              <div className="flex items-center gap-2 mb-4"><div className="bg-blue-600 text-white p-2 rounded-lg"><FileText className="w-5 h-5" /></div><h2 className={`text-xl font-bold ${theme.text}`}>Ficha: Bens e Direitos (Posição em 31/12)</h2></div>
              <div className="grid gap-4">
                {Object.values(irReport.portfolio).filter((a: PortfolioAsset) => a.quantity > 0).length > 0 ? (
                  Object.values(irReport.portfolio).filter((a: PortfolioAsset) => a.quantity > 0).map((asset: PortfolioAsset) => {
                      const brokersList = asset.brokers.size > 0 ? Array.from(asset.brokers).join(', ') : '(INSERIR NOME)';
                      const descText = `${asset.quantity} COTA(S) DE ${ASSET_TYPES[asset.assetType]?.label || 'ATIVO'} ${asset.ticker}, CUSTO MÉDIO DE ${formatCurrency(asset.averagePrice)}, CUSTODIADO NA CORRETORA ${brokersList.toUpperCase()}.`;
                      return (<div key={asset.ticker} className={`${theme.card} p-4 rounded-xl border ${theme.cardBorder} flex flex-col md:flex-row gap-4 justify-between items-center group hover:border-blue-500/50 transition-all`}><div className="flex-1"><span className={`text-[10px] font-bold ${theme.highlight} ${theme.subText} px-2 py-0.5 rounded uppercase mb-2 inline-block`}>Cód: {ASSET_TYPES[asset.assetType]?.code}</span><p className={`font-mono text-xs ${theme.subText} ${theme.highlight} p-3 rounded border ${theme.cardBorder} group-hover:${theme.card} transition-colors`}>{descText}</p><p className={`text-[10px] ${theme.subText} mt-2 font-bold`}>Saldo 31/12: {formatCurrency(asset.totalCost)}</p></div><button onClick={() => copyToClipboard(descText)} className={`flex items-center gap-2 text-xs font-bold ${theme.card} border ${theme.cardBorder} hover:bg-blue-500/10 hover:text-blue-500 ${theme.subText} px-4 py-2 rounded-lg transition-all`}><Copy size={14} /> Copiar</button></div>);
                  })
                ) : (<div className={`text-center py-12 ${theme.subText} ${theme.card} border ${theme.cardBorder} rounded-xl`}>Nenhuma posição encontrada para 31/12/{selectedYear}.</div>)}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4"><div className="bg-purple-600 text-white p-2 rounded-lg"><Activity className="w-5 h-5" /></div><h2 className={`text-xl font-bold ${theme.text}`}>Ficha: Renda Variável (Lucro/Prejuízo Mensal)</h2></div>
              <p className={`text-sm ${theme.subText} mb-4`}>Declare os valores abaixo mês a mês na ficha de Renda Variável.</p>
              <div className={`${theme.card} border ${theme.cardBorder} rounded-xl overflow-hidden`}>
                <table className="w-full text-sm">
                   <thead>
                      <tr className={`${theme.tableHeader} text-left`}>
                        <th className="p-3">Mês</th>
                        <th className="p-3 text-right">Vendas Ações (20k Limit)</th>
                        <th className="p-3 text-right">Lucro Líq. Ações</th>
                        <th className="p-3 text-right">Lucro Líq. FIIs</th>
                        <th className="p-3 text-right">Lucro Líq. Outros</th>
                        <th className="p-3 text-right text-red-500">Imposto (Estimado)</th>
                      </tr>
                   </thead>
                   <tbody className={`divide-y ${theme.cardBorder}`}>
                     {Object.keys(irReport.monthlySummary).sort().map(ym => {
                         const data = irReport.monthlySummary[ym];
                         const [year, month] = ym.split('-');
                         const monthName = MONTHS[parseInt(month)-1];
                         const isExempt = data.sales.ACAO < 20000;
                         const tax = data.tax;
                         return (
                            <tr key={ym} className={`hover:${theme.highlight}`}>
                               <td className={`p-3 font-medium ${theme.text}`}>{monthName}</td>
                               <td className="p-3 text-right">
                                  <span className={isExempt ? theme.success : theme.warning}>{formatCurrency(data.sales.ACAO)}</span>
                                  {isExempt && data.sales.ACAO > 0 && <span className={`text-[9px] block ${theme.success}`}>ISENTO</span>}
                               </td>
                               <td className={`p-3 text-right font-bold ${data.profit.ACAO >= 0 ? theme.success : theme.danger}`}>{formatCurrency(data.profit.ACAO)}</td>
                               <td className={`p-3 text-right font-bold ${data.profit.FII >= 0 ? theme.success : theme.danger}`}>{formatCurrency(data.profit.FII)}</td>
                               <td className={`p-3 text-right font-bold ${data.profit.ETF >= 0 ? theme.success : theme.danger}`}>{formatCurrency(data.profit.ETF)}</td>
                               <td className={`p-3 text-right font-bold ${theme.danger}`}>{tax > 0 ? formatCurrency(tax) : '-'}</td>
                            </tr>
                         );
                     })}
                     {Object.keys(irReport.monthlySummary).length === 0 && (<tr><td colSpan={6} className={`p-6 text-center ${theme.subText}`}>Nenhuma venda registrada neste ano.</td></tr>)}
                   </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      {showImportModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"><div className={`${theme.card} rounded-2xl shadow-2xl w-full max-w-lg p-6 transform transition-all scale-100`}><h3 className={`text-xl font-bold ${theme.text} mb-2 flex items-center gap-2`}><Sparkles className="text-purple-600"/> Importação Mágica</h3><textarea className={`w-full h-32 border ${theme.cardBorder} rounded-xl p-4 text-sm ${theme.input}`} placeholder="Ex: Comprei 200 ações de ITAUSA hoje a 9 reais..." value={importText} onChange={e => setImportText(e.target.value)} /><div className="flex justify-end gap-3 mt-4"><button onClick={() => setShowImportModal(false)} className={`px-4 py-2 ${theme.subText} font-medium hover:${theme.highlight} rounded-lg`}>Cancelar</button><button onClick={handleSmartImport} disabled={isImporting} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium shadow-lg shadow-purple-200 flex items-center gap-2 hover:bg-purple-700 transition-all">{isImporting ? <Loader2 size={16} className="animate-spin" /> : 'Processar Texto'}</button></div></div></div>)}
    </div>
  );
}
