import React, { useState } from 'react';
import { InventoryItem, Requisition } from '../types';
import { analyzeInventoryHealth, chatWithInventory } from '../services/geminiService';
import { Sparkles, Send, Bot, RefreshCw } from 'lucide-react';

interface AIAssistantProps {
  inventory: InventoryItem[];
  requisitions: Requisition[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ inventory, requisitions }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  const runAnalysis = async () => {
    setLoadingAnalysis(true);
    const result = await analyzeInventoryHealth(inventory, requisitions);
    setAnalysis(result);
    setLoadingAnalysis(false);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoadingChat(true);

    const aiResponse = await chatWithInventory(userMsg, inventory);
    
    setChatHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setLoadingChat(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
      {/* Left: Health Check Report */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Sparkles size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Auditoría Inteligente</h3>
          </div>
          <p className="text-slate-600 text-sm">
            El asistente analiza vencimientos, excesos y faltas para sugerir correcciones en el inventario físico vs contable.
          </p>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {!analysis ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <p className="text-slate-500 mb-4 max-w-xs">Genera un reporte instantáneo sobre la salud de tu stock.</p>
              <button 
                onClick={runAnalysis}
                disabled={loadingAnalysis}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-medium transition flex items-center gap-2 shadow-lg shadow-indigo-200"
              >
                {loadingAnalysis ? <RefreshCw className="animate-spin" /> : <Sparkles size={18} />}
                {loadingAnalysis ? 'Analizando...' : 'Generar Análisis de Stock'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="prose prose-sm prose-slate max-w-none">
                <p className="whitespace-pre-line text-slate-700 leading-relaxed">{analysis}</p>
              </div>
              <button 
                onClick={runAnalysis}
                className="text-sm text-indigo-600 hover:text-indigo-800 underline mt-4"
              >
                Actualizar Análisis
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Chat Interface */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <Bot size={18} />
            Pregunta al Inventario
          </h3>
          <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">Gemini 2.5 Flash</span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
          {chatHistory.length === 0 && (
            <div className="text-center text-slate-400 mt-10">
              <p>Ejemplos de preguntas:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>"¿Cuántas cajas de Dipirona hay en Chile?"</li>
                <li>"¿Qué productos vencen los próximos 2 meses?"</li>
                <li>"¿Hay stock suficiente de Tubos de Ensayo?"</li>
              </ul>
            </div>
          )}
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-pharma-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loadingChat && (
            <div className="flex justify-start">
              <div className="bg-slate-100 p-3 rounded-xl rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendChat} className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input
            type="text"
            className="flex-1 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pharma-500"
            placeholder="Escribe tu pregunta..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loadingChat || !chatInput.trim()}
            className="bg-pharma-600 hover:bg-pharma-700 text-white p-2 rounded-lg transition disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;