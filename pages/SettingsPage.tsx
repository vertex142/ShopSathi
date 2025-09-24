import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { CompanySettings } from '../types';
import { Upload, RefreshCw, Building2, FileSignature, BookText, DatabaseZap, Trash2, UploadCloud, XCircle, Download } from 'lucide-react';

type TermCategory = 'invoiceTerms' | 'quoteTerms' | 'purchaseOrderTerms';

const SettingsCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className }) => (
  <div className={`bg-white p-6 md:p-8 rounded-lg shadow-md ${className}`}>
    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
      {icon}
      <span className="ml-3">{title}</span>
    </h2>
    <div className="space-y-6">
      {children}
    </div>
  </div>
);

const SettingsPage: React.FC = React.memo(() => {
  const { state, dispatch } = useData();
  const [settings, setSettings] = useState<CompanySettings>(state.settings);
  const [newTermText, setNewTermText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [activeTab, setActiveTab] = useState<TermCategory>('invoiceTerms');
  const importFileRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setSettings(state.settings);
  }, [state.settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setSettings({ ...settings, authorizedSignatureImage: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  const removeSignature = () => {
      setSettings({ ...settings, authorizedSignatureImage: '' });
  };

  const addTerm = () => {
    if (newTermText.trim() === '') return;
    const newTerm = { id: crypto.randomUUID(), text: newTermText };
    setSettings(prev => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), newTerm]
    }));
    setNewTermText('');
  };

  const deleteTerm = (id: string) => {
    setSettings(prev => ({
        ...prev,
        [activeTab]: (prev[activeTab] || []).filter(term => term.id !== id)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    setFeedback('Settings updated successfully!');
    setTimeout(() => setFeedback(''), 3000);
  };
  
  const handleExport = () => {
    try {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(state, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        const date = new Date().toISOString().slice(0, 10);
        link.download = `shopsathi_backup_${date}.json`;
        link.click();
    } catch (err) {
        alert("Error exporting data.");
        console.error(err);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const result = event.target?.result;
            if (typeof result === 'string') {
                const parsedData = JSON.parse(result);
                if (parsedData.settings && parsedData.customers && Array.isArray(parsedData.customers)) {
                     if (window.confirm('Are you sure you want to import this data? This will overwrite all current data.')) {
                        dispatch({ type: 'IMPORT_DATA', payload: parsedData });
                        alert('Data imported successfully!');
                    }
                } else {
                    throw new Error("Invalid file structure.");
                }
            }
        } catch (err) {
            alert("Error importing data. Please make sure you are using a valid backup file.");
            console.error(err);
        } finally {
            if(importFileRef.current) {
                importFileRef.current.value = "";
            }
        }
    };
    reader.readAsText(file);
  };
  
  const handleReset = () => {
     if (window.confirm('Are you ABSOLUTELY sure you want to reset all application data? This action cannot be undone and all your data will be lost.')) {
        if (window.prompt('To confirm, please type "RESET" in the box below.') === 'RESET') {
            dispatch({ type: 'RESET_APP', payload: null });
            alert('Application has been reset to its initial state.');
        } else {
             alert('Reset cancelled. You did not type "RESET".');
        }
    }
  }

  const currentTerms = settings[activeTab] || [];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
        
        <SettingsCard title="Company Profile" icon={<Building2 className="h-6 w-6 text-brand-blue" />}>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Company Name</label>
                <input type="text" name="name" id="name" value={settings.name} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Company Logo</label>
                <div className="mt-2 flex items-center space-x-4">
                    {settings.logo ? 
                        <img src={settings.logo} alt="Company Logo" className="h-16 w-16 object-contain rounded-md bg-gray-100 p-1 border" /> 
                        : <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">No Logo</div>
                    }
                    <input type="file" id="logo" onChange={handleLogoChange} accept="image/*" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                </div>
            </div>
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                <input type="text" name="address" id="address" value={settings.address} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="phone1" className="block text-sm font-medium text-gray-700">Phone 1</label>
                    <input type="text" name="phone1" id="phone1" value={settings.phone1} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="phone2" className="block text-sm font-medium text-gray-700">Phone 2</label>
                    <input type="text" name="phone2" id="phone2" value={settings.phone2} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" id="email" value={settings.email} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="tagline" className="block text-sm font-medium text-gray-700">Tagline</label>
                    <input type="text" name="tagline" id="tagline" value={settings.tagline} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="services" className="block text-sm font-medium text-gray-700">Services</label>
                    <input type="text" name="services" id="services" value={settings.services} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
            </div>
        </SettingsCard>
        
        <SettingsCard title="Document Customization" icon={<FileSignature className="h-6 w-6 text-brand-blue" />}>
            <div>
                <label htmlFor="footerText" className="block text-sm font-medium text-gray-700">Invoice Footer Text</label>
                <textarea name="footerText" id="footerText" value={settings.footerText} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md shadow-sm" placeholder="e.g., Thank you for your business! Payment is due within 30 days."></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="preparedByLabel" className="block text-sm font-medium text-gray-700">"Prepared By" Label</label>
                    <input type="text" name="preparedByLabel" id="preparedByLabel" value={settings.preparedByLabel} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="authorizedSignatureLabel" className="block text-sm font-medium text-gray-700">"Authorized Signature" Label</label>
                    <input type="text" name="authorizedSignatureLabel" id="authorizedSignatureLabel" value={settings.authorizedSignatureLabel} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Authorized Signature Image</label>
                <div className="mt-2 flex items-center space-x-4">
                    {settings.authorizedSignatureImage ? (
                        <div className="relative">
                            <img src={settings.authorizedSignatureImage} alt="Signature" className="h-16 object-contain rounded-md bg-gray-100 p-2 border" />
                            <button type="button" onClick={removeSignature} className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700">
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="w-32 h-16 flex items-center justify-center bg-gray-100 border-2 border-dashed rounded-md text-gray-400">
                            No Image
                        </div>
                    )}
                    <label htmlFor="signatureUpload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <UploadCloud className="inline-block h-4 w-4 mr-2" />
                        <span>Upload</span>
                        <input id="signatureUpload" name="signatureUpload" type="file" className="sr-only" onChange={handleSignatureChange} accept="image/*" />
                    </label>
                </div>
            </div>
        </SettingsCard>
        
        <SettingsCard title="Terms & Conditions" icon={<BookText className="h-6 w-6 text-brand-blue" />}>
             <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button type="button" onClick={() => setActiveTab('invoiceTerms')} className={`${activeTab === 'invoiceTerms' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm`}>
                        Invoice Terms
                    </button>
                    <button type="button" onClick={() => setActiveTab('quoteTerms')} className={`${activeTab === 'quoteTerms' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm`}>
                        Quote Terms
                    </button>
                    <button type="button" onClick={() => setActiveTab('purchaseOrderTerms')} className={`${activeTab === 'purchaseOrderTerms' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm`}>
                        Purchase Order Terms
                    </button>
                </nav>
            </div>
            <div className="mt-4">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {currentTerms.map(term => (
                        <div key={term.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <p className="text-sm text-gray-800 flex-grow">{term.text}</p>
                            <button type="button" onClick={() => deleteTerm(term.id)} className="text-red-500 hover:text-red-700 p-1 ml-2 flex-shrink-0">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                     {currentTerms.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No terms defined for this category.</p>}
                </div>
                <div className="mt-4 flex gap-2">
                    <input 
                        type="text"
                        value={newTermText}
                        onChange={(e) => setNewTermText(e.target.value)}
                        placeholder="Add a new term"
                        className="flex-grow p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"
                    />
                    <button type="button" onClick={addTerm} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Add</button>
                </div>
            </div>
        </SettingsCard>

        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg shadow-md">
            <h2 className="text-xl font-bold text-red-800 mb-6 flex items-center">
                <DatabaseZap className="h-6 w-6" /> <span className="ml-3">Data Management</span>
            </h2>
            <div className="space-y-4">
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg bg-white">
                    <div>
                        <h3 className="font-semibold">Export Data</h3>
                        <p className="text-sm text-gray-600 mt-1">Download a full backup of all your application data.</p>
                    </div>
                    <button type="button" onClick={handleExport} className="mt-3 sm:mt-0 w-full sm:w-auto flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-md" title="Download a JSON backup file of all your current data.">
                        <Download className="h-4 w-4 mr-2"/> Export All Data
                    </button>
                </div>
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg bg-white">
                    <div>
                        <h3 className="font-semibold">Import Data</h3>
                        <p className="text-sm text-gray-600 mt-1">Restore data from a backup file. This will overwrite all current data.</p>
                    </div>
                     <label htmlFor="import-file-input" className="cursor-pointer mt-3 sm:mt-0 w-full sm:w-auto flex items-center justify-center text-sm font-medium text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-md" title="Caution: Importing a file will replace all existing data in the application.">
                       <Upload className="h-4 w-4 mr-2"/> Import from Backup
                    </label>
                    <input type="file" ref={importFileRef} onChange={handleImport} accept=".json" className="hidden" id="import-file-input" />
                </div>
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg bg-white">
                    <div>
                        <h3 className="font-semibold text-red-700">Reset Application</h3>
                        <p className="text-sm text-red-600 mt-1">Permanently delete all data and reset the application.</p>
                    </div>
                    <button type="button" onClick={handleReset} className="mt-3 sm:mt-0 w-full sm:w-auto flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-md" title="Warning: This is irreversible and will delete all customers, invoices, and settings.">
                        <RefreshCw className="h-4 w-4 mr-2"/> Reset All Data
                    </button>
                </div>
            </div>
        </div>
        
        <div className="flex justify-end items-center pt-6 sticky bottom-0 bg-gray-100 py-4 z-10">
            {feedback && <p className="text-green-600 text-sm mr-4">{feedback}</p>}
            <button type="submit" className="bg-brand-blue text-white px-8 py-3 rounded-md hover:bg-brand-blue-light transition-colors text-base font-semibold shadow-lg">Save All Settings</button>
        </div>
    </form>
  );
});

export default SettingsPage;