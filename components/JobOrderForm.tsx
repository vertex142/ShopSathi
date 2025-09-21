

import React, { useState, useMemo } from 'react';
// Fix: Corrected type to omit userId for new job orders, aligning with context function signatures.
import type { JobOrder, JobCostBreakdown, Customer } from '../types';
import { JobStatus } from '../types';
import { useData } from '../context/DataContext';
import { Trash2, Calculator, Plus, UploadCloud, Palette, FileText, LoaderCircle, XCircle } from 'lucide-react';
import JobCostCalculator from './JobCostCalculator';
import CustomerForm from './CustomerForm';
import { analyzeImageWithPrompt } from '../services/geminiService';
import AIResponseModal from './AIResponseModal';

interface JobOrderFormProps {
  job: JobOrder | null;
  onClose: () => void;
}

const JobOrderForm: React.FC<JobOrderFormProps> = ({ job, onClose }) => {
  // Fix: Replaced dispatch with specific data context functions.
  const { state, addJobOrder, updateJobOrder } = useData();
  // Fix: Corrected form state type to omit userId, which is handled by the context.
  const [formData, setFormData] = useState<Omit<JobOrder, 'id' | 'userId'>>({
    jobName: job?.jobName || '',
    customerId: job?.customerId || (state.customers.length > 0 ? state.customers[0].id : ''),
    orderDate: job?.orderDate || new Date().toISOString().split('T')[0],
    dueDate: job?.dueDate || '',
    status: job?.status || JobStatus.Pending,
    description: job?.description || '',
    quantity: job?.quantity || 1,
    paperType: job?.paperType || '',
    size: job?.size || '',
    finishing: job?.finishing || '',
    price: job?.price || 0,
    notes: job?.notes || '',
    materialsUsed: job?.materialsUsed || [],
    inventoryConsumed: job?.inventoryConsumed || false,
    costBreakdown: job?.costBreakdown,
    estimatedCost: job?.estimatedCost,
    designImage: job?.designImage,
    designImageMimeType: job?.designImageMimeType,
  });

  const [showCostCalculator, setShowCostCalculator] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({ 
        ...formData, 
        [name]: type === 'number' ? parseFloat(value) || 0 : value 
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64String = (event.target?.result as string).split(',')[1];
            setFormData(prev => ({ ...prev, designImage: base64String, designImageMimeType: file.type }));
        };
        reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, designImage: undefined, designImageMimeType: undefined }));
  };

  const handleAiAnalysis = async (prompt: string) => {
    if (!formData.designImage || !formData.designImageMimeType) {
        alert("Please upload a design image first.");
        return;
    }
    setIsAnalyzing(true);
    try {
        const result = await analyzeImageWithPrompt(formData.designImage, formData.designImageMimeType, prompt);
        setAiResponse(result);
    } catch (e) {
        alert("AI analysis failed. Please try again.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleMaterialChange = (index: number, field: 'itemId' | 'quantity', value: string) => {
    const newMaterials = [...formData.materialsUsed];
    newMaterials[index] = {
      ...newMaterials[index],
      [field]: field === 'quantity' ? parseInt(value, 10) || 0 : value,
    };
    setFormData({ ...formData, materialsUsed: newMaterials });
  };

  const addMaterial = () => {
    if (state.inventoryItems.length > 0) {
      setFormData({
        ...formData,
        materialsUsed: [
          ...formData.materialsUsed,
          { itemId: '', quantity: 1 },
        ],
      });
    } else {
      alert("Please add items to your inventory first.");
    }
  };

  const removeMaterial = (index: number) => {
    const newMaterials = formData.materialsUsed.filter((_, i) => i !== index);
    setFormData({ ...formData, materialsUsed: newMaterials });
  };

  const handleSaveCosts = (costBreakdown: JobCostBreakdown, total: number) => {
    setFormData(prev => ({
        ...prev,
        costBreakdown,
        estimatedCost: total,
    }));
  };

  const handleNewCustomerSave = (newCustomer: Customer) => {
    setFormData(prev => ({ ...prev, customerId: newCustomer.id }));
    setShowCustomerForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (job) {
      // Fix: Call updateJobOrder with the full JobOrder object.
      await updateJobOrder({ ...formData, id: job.id, userId: job.userId });
    } else {
      // Fix: Call addJobOrder with form data (userId is added by context).
      await addJobOrder(formData);
    }
    onClose();
  };
  
  const { profit, profitMargin } = useMemo(() => {
    if (formData.estimatedCost !== undefined && formData.price > 0) {
        const profitValue = formData.price - formData.estimatedCost;
        const profitMarginValue = (profitValue / formData.price) * 100;
        return { profit: profitValue, profitMargin: profitMarginValue };
    }
    return { profit: undefined, profitMargin: undefined };
  }, [formData.price, formData.estimatedCost]);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">{job ? 'Edit Job Order' : 'Create Job Order'}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label htmlFor="jobName" className="block text-sm font-medium text-gray-700">Job Name</label>
                      <input type="text" id="jobName" name="jobName" value={formData.jobName} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                  <div>
                      <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">Customer</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <select id="customerId" name="customerId" value={formData.customerId} onChange={handleChange} required className="block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="">Select Customer</option>
                            {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button type="button" onClick={() => setShowCustomerForm(true)} className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300" title="Add New Customer">
                            <Plus className="h-5 w-5" />
                        </button>
                      </div>
                  </div>
                  <div>
                      <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700">Order Date</label>
                      <input type="date" id="orderDate" name="orderDate" value={formData.orderDate} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                  <div>
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                      <input type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Job Description</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={5} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"></textarea>
                </div>
                {process.env.API_KEY && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Customer Design</label>
                        {formData.designImage ? (
                            <div className="relative">
                                <img src={`data:${formData.designImageMimeType};base64,${formData.designImage}`} alt="Design Preview" className="rounded-md border max-h-32" />
                                <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700">
                                    <XCircle className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                             <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100">
                                <UploadCloud className="h-8 w-8 text-gray-400" />
                                <span className="text-sm text-gray-500">Click to upload</span>
                                <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        )}
                        <div className="flex space-x-2">
                            <button type="button" onClick={() => handleAiAnalysis("Analyze the primary colors in this design and list them with hex codes.")} disabled={!formData.designImage || isAnalyzing} className="text-xs flex items-center p-2 border rounded-md hover:bg-gray-100 disabled:opacity-50">
                                {isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4 mr-1"/>} Analyze Colors
                            </button>
                            <button type="button" onClick={() => handleAiAnalysis("Based on this image, suggest a professional, one-sentence job description.")} disabled={!formData.designImage || isAnalyzing} className="text-xs flex items-center p-2 border rounded-md hover:bg-gray-100 disabled:opacity-50">
                                {isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 mr-1"/>} Suggest Desc.
                            </button>
                        </div>
                    </div>
                )}
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                  <div>
                      <label htmlFor="paperType" className="block text-sm font-medium text-gray-700">Paper Type</label>
                      <input type="text" id="paperType" name="paperType" value={formData.paperType} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                  <div>
                      <label htmlFor="size" className="block text-sm font-medium text-gray-700">Size</label>
                      <input type="text" id="size" name="size" value={formData.size} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                  <div>
                      <label htmlFor="finishing" className="block text-sm font-medium text-gray-700">Finishing</label>
                      <input type="text" id="finishing" name="finishing" value={formData.finishing} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
              </div>

              <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Materials Used (from Inventory)</h3>
                  <div className="space-y-4">
                      {formData.materialsUsed.map((material, index) => {
                          const selectedItem = state.inventoryItems.find(i => i.id === material.itemId);
                          return (
                              <div key={index} className="grid grid-cols-12 gap-x-3 items-center">
                                  <div className="col-span-6">
                                      <select 
                                          value={material.itemId} 
                                          onChange={(e) => handleMaterialChange(index, 'itemId', e.target.value)} 
                                          className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"
                                          required
                                      >
                                          <option value="">Select a material</option>
                                          {state.inventoryItems.map(item => (
                                              <option key={item.id} value={item.id}>
                                                  {item.name} (In Stock: {item.stockQuantity})
                                              </option>
                                          ))}
                                      </select>
                                  </div>
                                  <div className="col-span-3">
                                      <input 
                                          type="number" 
                                          value={material.quantity}
                                          onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                                          className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"
                                          placeholder="Qty"
                                          min="1"
                                          max={selectedItem?.stockQuantity}
                                      />
                                  </div>
                                  <div className="col-span-2">
                                      <span className="text-sm text-gray-600">
                                        Cost: ${((selectedItem?.unitCost || 0) * material.quantity).toFixed(2)}
                                      </span>
                                  </div>
                                  <div className="col-span-1 text-right">
                                      <button type="button" onClick={() => removeMaterial(index)} className="text-red-500 hover:text-red-700 p-1">
                                          <Trash2 className="h-5 w-5" />
                                      </button>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
                  <button type="button" onClick={addMaterial} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50" disabled={state.inventoryItems.length === 0}>
                      + Add Material
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t mt-6">
                  <div className="space-y-4">
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                      <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>

                      <button type="button" onClick={() => setShowCostCalculator(true)} className="w-full flex items-center justify-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                          <Calculator className="h-4 w-4 mr-2" />
                          Calculate Job Costs
                      </button>
                  </div>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800">Profitability</h4>
                      <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Estimated Cost:</span>
                          <span className="text-sm font-medium text-red-600">${formData.estimatedCost?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Estimated Profit:</span>
                          <span className="text-sm font-medium text-green-600">${profit?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Profit Margin:</span>
                          <span className="text-sm font-medium text-green-600">{profitMargin?.toFixed(1) || 'N/A'}%</span>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t mt-6">
                  <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                      <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm">
                          {Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
                  <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Internal Notes</label>
                      <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"></textarea>
                  </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 mt-4 border-t">
                  <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                  <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">{job ? 'Update Job' : 'Save Job'}</button>
              </div>
          </form>
        </div>
      </div>
      {showCostCalculator && (
        <JobCostCalculator 
            initialCosts={formData.costBreakdown}
            onSave={handleSaveCosts}
            onClose={() => setShowCostCalculator(false)}
        />
      )}
      {showCustomerForm && (
        <CustomerForm 
            customer={null}
            onClose={() => setShowCustomerForm(false)}
            onSave={handleNewCustomerSave}
        />
    )}
    {aiResponse && (
        <AIResponseModal 
            title="AI Analysis Result"
            content={aiResponse}
            onClose={() => setAiResponse(null)}
        />
    )}
    </>
  );
};

export default JobOrderForm;
