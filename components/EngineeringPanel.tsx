import React, { useState } from 'react';
import { Recipe, InventoryItem, Category } from '../types';
import { Plus, Trash2, FlaskConical, Save, ChevronDown, ChevronUp } from 'lucide-react';

interface EngineeringPanelProps {
  recipes: Recipe[];
  inventoryItems: InventoryItem[];
  onAddRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
}

const EngineeringPanel: React.FC<EngineeringPanelProps> = ({ recipes, inventoryItems, onAddRecipe, onDeleteRecipe }) => {
  const [showForm, setShowForm] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Recipe>>({
    finalProductSku: '',
    finalProductName: '',
    description: '',
    ingredients: [],
    version: '1.0',
    active: true
  });

  const [ingredientLine, setIngredientLine] = useState({ sku: '', quantity: 0 });

  const rawMaterials = inventoryItems.filter(i => i.category === Category.RAW_MATERIAL);

  const addIngredient = () => {
    if (!ingredientLine.sku || ingredientLine.quantity <= 0) return;
    const item = inventoryItems.find(i => i.sku === ingredientLine.sku);
    if (!item) return;

    const newIngredients = [
      ...(formData.ingredients || []),
      { sku: item.sku, name: item.name, quantityRequired: ingredientLine.quantity, unit: item.unit }
    ];
    setFormData({ ...formData, ingredients: newIngredients });
    setIngredientLine({ sku: '', quantity: 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.finalProductSku || !formData.finalProductName || (formData.ingredients?.length || 0) === 0) {
      alert("Complete los campos obligatorios y agregue al menos un ingrediente.");
      return;
    }
    onAddRecipe({
      ...formData as Recipe,
      id: Math.random().toString(36).substr(2, 9)
    });
    setShowForm(false);
    setFormData({ finalProductSku: '', finalProductName: '', description: '', ingredients: [], version: '1.0', active: true });
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Ingeniería & Fórmulas</h2>
          <p className="text-slate-500">Gestión de Recetas (Bill of Materials) y Procesos.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-pharma-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Nueva Fórmula
        </button>
      </header>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
          <h3 className="text-lg font-bold mb-4">Crear Nueva Receta</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium">SKU Producto Final</label>
              <input className="w-full p-2 border rounded" value={formData.finalProductSku} onChange={e => setFormData({...formData, finalProductSku: e.target.value})} placeholder="Ej: PT-VAC-001" />
            </div>
            <div>
              <label className="block text-sm font-medium">Nombre Producto</label>
              <input className="w-full p-2 border rounded" value={formData.finalProductName} onChange={e => setFormData({...formData, finalProductName: e.target.value})} />
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-sm mb-2">Ingredientes (Materia Prima)</h4>
            <div className="flex gap-2 mb-2">
              <select className="flex-1 p-2 border rounded" value={ingredientLine.sku} onChange={e => setIngredientLine({...ingredientLine, sku: e.target.value})}>
                <option value="">Seleccione Insumo...</option>
                {rawMaterials.map(m => <option key={m.id} value={m.sku}>{m.name} ({m.unit})</option>)}
              </select>
              <input type="number" className="w-24 p-2 border rounded" placeholder="Cant." value={ingredientLine.quantity} onChange={e => setIngredientLine({...ingredientLine, quantity: Number(e.target.value)})} />
              <button type="button" onClick={addIngredient} className="bg-indigo-600 text-white px-3 py-2 rounded">Add</button>
            </div>
            <ul className="space-y-1">
              {formData.ingredients?.map((ing, idx) => (
                <li key={idx} className="text-sm flex justify-between bg-white p-2 rounded border">
                  <span>{ing.name}</span>
                  <span className="font-bold">{ing.quantityRequired} {ing.unit}</span>
                </li>
              ))}
            </ul>
          </div>

          <button onClick={handleSubmit} className="w-full bg-emerald-600 text-white py-2 rounded font-bold flex justify-center gap-2">
             <Save size={18} /> Guardar Receta
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {recipes.map(recipe => (
          <div key={recipe.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}>
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-2 rounded text-indigo-600"><FlaskConical size={24} /></div>
                <div>
                  <h4 className="font-bold text-slate-800">{recipe.finalProductName}</h4>
                  <p className="text-xs text-slate-500 font-mono">{recipe.finalProductSku} • v{recipe.version}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Activa</span>
                 {expandedRecipe === recipe.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
              </div>
            </div>
            
            {expandedRecipe === recipe.id && (
              <div className="bg-slate-50 p-4 border-t border-slate-100">
                <h5 className="text-xs font-bold uppercase text-slate-500 mb-2">Lista de Materiales (BOM)</h5>
                <table className="w-full text-sm">
                  <tbody>
                    {recipe.ingredients.map((ing, idx) => (
                      <tr key={idx} className="border-b border-slate-200 last:border-0">
                        <td className="py-2 text-slate-600">{ing.name}</td>
                        <td className="py-2 text-right font-mono font-medium">{ing.quantityRequired} {ing.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 flex justify-end">
                   <button onClick={() => onDeleteRecipe(recipe.id)} className="text-red-500 text-xs flex items-center gap-1 hover:underline"><Trash2 size={12} /> Eliminar Receta</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EngineeringPanel;