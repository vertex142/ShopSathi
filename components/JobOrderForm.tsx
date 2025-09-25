import React, { useState, useMemo } from 'react';
import type { JobOrder, JobCostBreakdown, Customer, OldJobCostBreakdown } from '../types';
import { JobStatus } from '../types';
import { useData } from '../context/DataContext';
import { Trash2, Calculator, Plus, UploadCloud, Palette, FileText, LoaderCircle, XCircle } from 'lucide-react';
import JobCostCalculator from './JobCostCalculator';
import CustomerForm from './CustomerForm';
import { analyzeImageWithPrompt } from '../services/geminiService';
import AIResponseModal from './AIResponseModal';
import { formatCurrency } from '../utils/formatCurrency';
import SearchableSelect from './SearchableSelect';

interface JobOrderFormProps {
  job: JobOrder | null;
  onClose: () => void;
}

const isNewCostBreakdown = (breakdown: any): breakdown is JobCostBreakdown => {
    return breakdown && typeof breakdown.paper === 'object' && breakdown.paper !== null;
};

const JobOrderForm: React.FC<JobOrderFormProps> = ({ job, onClose }) => {
  const { state, dispatch } = useData();
  const [formData, setFormData] = useState<Omit<JobOrder, 'id'>>({
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
    estimatedCostBreakdown: job?.estimatedCostBreakdown,
    actualCostBreakdown: job?.actualCostBreakdown,
    designImage: job?.designImage,
    designImageMimeType: job?.designImageMimeType,
  });

  const [showCostCalculator, setShowCostCalculator] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const customerOptions = useMemo(() => state.customers.map(c => ({ value: c.id, label: c.name })), [state.customers]);
  const inventoryOptions = useMemo(() => state.inventoryItems.map(i => ({ value: i.id, label: `${i.name} (In Stock: ${i.stockQuantity})` })), [state.inventoryItems]);

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
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("File is too large. Please upload an image under 2MB.");
            return;
        }
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

  const handleSaveCosts = (estimated: JobCostBreakdown, actual: JobCostBreakdown) => {
    setFormData(prev => ({
        ...prev,
        estimatedCostBreakdown: estimated,
        actualCostBreakdown: actual,
    }));
  };

  const handleNewCustomerSave = (newCustomer: Customer) => {
    setFormData(prev => ({ ...prev, customerId: newCustomer.id }));
    setShowCustomerForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (job) {
      dispatch({ type: 'UPDATE_JOB_ORDER', payload: { ...formData, id: job.id } });
    } else {
      dispatch({ type: 'ADD_JOB_ORDER', payload: formData });
    }
    onClose();
  };
  
  const { estimatedTotalCost, actualTotalCost, estimatedProfit, actualProfit, estimatedProfitMargin, actualProfitMargin } = useMemo(() => {
    const calculateTotal = (breakdown: JobCostBreakdown | OldJobCostBreakdown | undefined): number => {
        if (!breakdown) return 0;
        if (isNewCostBreakdown(breakdown)) {
            const standard = breakdown.paper.total + breakdown.ctp.total + breakdown.printing.total + breakdown.binding.total + breakdown.delivery.total + (breakdown.overhead?.total || 0);
            const labor = (breakdown.labor || []).reduce((sum, item) => sum + item.total, 0);
            const other = breakdown.otherExpenses.reduce((sum, item) => sum + item.total, 0);
            return standard + labor + other;
        } else { // Old format
            const breakdownOld = breakdown as OldJobCostBreakdown;
            const standard = breakdownOld.paper + breakdownOld.ctp + breakdownOld.printing + breakdownOld.binding + breakdownOld.delivery;
            const other = breakdownOld.otherExpenses.reduce((sum, item) => sum + item.amount, 0);
            return standard + other;
        }
    };

    const estTotal = calculateTotal(formData.estimatedCostBreakdown);
    const actTotal = calculateTotal(formData.actualCostBreakdown);

    const estProfit = formData.price - estTotal;
    const estMargin = formData.price > 0 ? (estProfit / formData.price) * 100 : 0;
    
    const actProfit = actTotal > 0 ? formData.price - actTotal : 0;
    const actMargin = actTotal > 0 && formData.price > 0 ? (actProfit / formData.price) * 100 : 0;

    return {
        estimatedTotalCost: estTotal,
        actualTotalCost: actTotal,
        estimatedProfit: estProfit,
        actualProfit: actProfit,
        estimatedProfitMargin: estMargin,
        actualProfitMargin: actMargin,
    };
  }, [formData.price, formData.estimatedCostBreakdown, formData.actualCostBreakdown]);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <header className="flex-shrink-0 p-6 border-b">
            <h2 className="text-2xl font-bold">{job ? 'Edit Job Order' : 'Create Job Order'}</h2>
          </header>
          <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label htmlFor="jobName" className="block text-sm font-medium text-gray-700">Job Name</label>
                      <input type="text" id="jobName" name="jobName" value={formData.jobName} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                      <p className="text-xs text-gray-500 mt-1">A descriptive name for this job (e.g., 'Business Cards for XYZ Corp').</p>
                  </div>
                  <div>
                      <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">Customer</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <SearchableSelect
                            value={formData.customerId}
                            onChange={(val) => setFormData(prev => ({...prev, customerId: val}))}
                            options={customerOptions}
                            placeholder="Select Customer"
                            className="w-full"
                        />
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
                  <p className="text-xs text-gray-500 mt-1">Provide detailed requirements for the job.</p>
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
                        <p className="text-xs text-gray-500 mt-1">
                            For internal reference and AI analysis.
                            <br />
                            <strong>Formats:</strong> JPG, PNG, GIF. <strong>Max Size:</strong> 2MB.
                        </p>
                        <div className="flex space-x-2">
                            <button type="button" onClick={() => handleAiAnalysis("Analyze the primary colors in this design and list them with hex codes.")} disabled={!formData.designImage || isAnalyzing} className="text-xs flex items-center p-2 border rounded-md hover:bg-gray-100 disabled:opacity-50" title="Use AI to analyze the design and suggest primary colors with hex codes.">
                                {isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4 mr-1"/>} Analyze Colors
                            </button>
                            <button type="button" onClick={() => handleAiAnalysis("Based on this image, suggest a professional, one-sentence job description.")} disabled={!formData.designImage || isAnalyzing} className="text-xs flex items-center p-2 border rounded-md hover:bg-gray-100 disabled:opacity-50" title="Use AI to analyze the design and suggest a professional job description.">
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
              <p className="text-xs text-gray-500 -mt-4">Specify the production details for this job.</p>

              <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Materials Used (from Inventory)</h3>
                  <div className="space-y-4">
                      {formData.materialsUsed.map((material, index) => {
                          const selectedItem = state.inventoryItems.find(i => i.id === material.itemId);
                          return (
                              <div key={index} className="grid grid-cols-12 gap-x-3 items-center">
                                  <div className="col-span-6">
                                      <SearchableSelect
                                          value={material.itemId}
                                          onChange={(val) => handleMaterialChange(index, 'itemId', val)}
                                          options={inventoryOptions}
                                          placeholder="Select a material"
                                      />
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
                                        Cost: {formatCurrency((selectedItem?.unitCost || 0) * material.quantity)}
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
                  <p className="text-xs text-gray-500 mt-1">Inventory will be automatically deducted when the job status is changed to 'Completed' or 'Delivered'.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t mt-6">
                  <div className="space-y-4">
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">Sale Price</label>
                      <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                      <p className="text-xs text-gray-500 -mt-3">The total price you are charging the customer for this job.</p>

                      <button type="button" onClick={() => setShowCostCalculator(true)} className="w-full flex items-center justify-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                          <Calculator className="h-4 w-4 mr-2" />
                          Manage Estimated & Actual Costs
                      </button>
                  </div>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 border-b border-dotted cursor-help" title="This analysis compares the sale price against the estimated and actual costs entered in the cost calculator.">Profitability Analysis</h4>
                      <div className="grid grid-cols-2 gap-x-4">
                          <div className="font-medium text-sm text-gray-500"></div>
                          <div className="font-medium text-sm text-gray-500">Estimated</div>
                          {actualTotalCost > 0 && <div className="font-medium text-sm text-gray-500">Actual</div>}
                          
                          <div className="text-sm text-gray-600">Cost:</div>
                          <div className="text-sm font-medium text-red-600">{formatCurrency(estimatedTotalCost)}</div>
                          {actualTotalCost > 0 && <div className="text-sm font-medium text-red-600">{formatCurrency(actualTotalCost)}</div>}
                          
                          <div className="text-sm text-gray-600">Profit:</div>
                          <div className="text-sm font-medium text-green-600">{formatCurrency(estimatedProfit)}</div>
                          {actualTotalCost > 0 && <div className="text-sm font-medium text-green-600">{formatCurrency(actualProfit)}</div>}
                          
                          <div className="text-sm text-gray-600">Margin:</div>
                          <div className="text-sm font-medium text-green-600">{estimatedProfitMargin.toFixed(1)}%</div>
                          {actualTotalCost > 0 && <div className="text-sm font-medium text-green-600">{actualProfitMargin.toFixed(1)}%</div>}
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
                      <p className="text-xs text-gray-500 mt-1">These notes are for your team only and will not be shown to the customer.</p>
                  </div>
              </div>
          </form>
           <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 border-t bg-gray-50 rounded-b-lg sticky bottom-0">
              <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
              <button type="submit" form="job-order-form" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">{job ? 'Update Job' : 'Save Job'}</button>
          </footer>
        </div>
      </div>
      {showCostCalculator && (
        <JobCostCalculator 
            job={job || { ...formData, id: 'temp-id' }}
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
