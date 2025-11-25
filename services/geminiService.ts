
import { GoogleGenAI } from "@google/genai";
import { InventoryItem, Requisition } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Analyze inventory for discrepancies, expiry risks, and suggestions
export const analyzeInventoryHealth = async (
  inventory: InventoryItem[],
  requisitions: Requisition[]
): Promise<string> => {
  try {
    const inventorySummary = inventory.map(i => 
      `${i.name} (${i.location}): ${i.quantity} ${i.unit}, Lote: ${i.batchNumber}, Vence: ${i.expiryDate}`
    ).join('\n');

    const reqSummary = requisitions.filter(r => r.status === 'PENDING').length;

    const prompt = `
      Actúa como un experto en Logística Farmacéutica y Gestión de Calidad.
      Analiza los siguientes datos de inventario y requisiciones pendientes.
      
      Datos del Inventario:
      ${inventorySummary}
      
      Requisiciones Pendientes: ${reqSummary}
      
      Por favor, proporciona un informe corto y directo (en español) con 3 insights:
      1. Riesgo de Vencimiento (productos próximos a vencer).
      2. Desbalance de Inventario (mucho stock en un lugar, poco en otro, o bajo el mínimo).
      3. Sugerencia de acción para el gerente.
      
      No uses markdown complejo, solo texto formateado en párrafos.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No fue posible generar el análisis en este momento.";
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return "Error al conectar con el asistente inteligente.";
  }
};

// Chat with your inventory data
export const chatWithInventory = async (
  query: string,
  inventory: InventoryItem[]
): Promise<string> => {
  try {
    const context = JSON.stringify(inventory.map(i => ({
      item: i.name,
      loc: i.location,
      qty: i.quantity,
      batch: i.batchNumber,
      exp: i.expiryDate
    })));

    const prompt = `
      Contexto: Eres un asistente de gestión de inventario para una industria farmacéutica.
      Datos actuales del inventario (JSON): ${context}
      
      Pregunta del usuario: "${query}"
      
      Responde de forma sucinta y profesional en Español. Si la pregunta es sobre cantidades, suma si es necesario.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Sin respuesta.";
  } catch (error) {
    return "Lo siento, no pude procesar tu pregunta.";
  }
};

// NEW: Suggest SKU Naming Convention
export const suggestSkuNamingConvention = async (
  productDescription: string,
  category: string
): Promise<string> => {
  try {
    const prompt = `
      Actúa como un arquitecto de datos maestros para una industria farmacéutica.
      El usuario quiere crear un nuevo SKU para el siguiente producto:
      Descripción: "${productDescription}"
      Categoría seleccionada: "${category}"

      Reglas de Nomenclatura PhageLab (Estrictas):
      1. Si la categoría es 'Materia Prima' -> Prefijo MP-{3 letras del nombre}-{001}
      2. Si la categoría es 'Producto Terminado' -> Prefijo PT-{3 letras}-{001}
      3. Si la categoría es 'Material de Laboratorio' -> Prefijo LAB-{TIPO}-{001}
      4. Si la categoría es 'Producto en Proceso (WIP)' -> Prefijo WIP-{PROCESO}-{001} (Ej: WIP-SOL-001)

      Genera 3 opciones de SKU únicas y profesionales.
      Formato JSON:
      [
        {"sku": "...", "reason": "..."},
        ...
      ]
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    return response.text || "Error generando SKUs";
  } catch (error) {
    console.error(error);
    return "Error en servicio de IA";
  }
};
