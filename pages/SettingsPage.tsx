// Fix: Added missing useEffect import.
import React, { useState, useCallback, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { CompanySettings } from '../types';
import { MapPin, Phone, Mail, Trash2, UploadCloud, XCircle } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { state, updateSettings } = useData();
  const [settings, setSettings] = useState<CompanySettings>(state.settings);
  const [newTermText, setNewTermText] = useState('');
  const [feedback, setFeedback] = useState('');
  
  // Keep local state in sync with context state
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
        termsAndConditions: [...(prev.termsAndConditions || []), newTerm]
    }));
    setNewTermText('');
  };

  const deleteTerm = (id: string) => {
    setSettings(prev => ({
        ...prev,
        termsAndConditions: (prev.termsAndConditions || []).filter(term => term.id !== id)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settings);
    setFeedback('Settings updated successfully!');
    setTimeout(() => setFeedback(''), 3000);
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Company Settings</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Company Name</label>
                    <input type="text" name="name" id="name" value={settings.name} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="logo" className="block text-sm font-medium text-gray-700">Company Logo</label>
                    <div className="mt-1 flex items-center space-x-4">
                        {settings.logo && <img src={settings.logo} alt="Company Logo" className="h-16 w-16 object-contain rounded-md bg-gray-100 p-1" />}
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
                 <div>
                    <label htmlFor="footerText" className="block text-sm font-medium text-gray-700">Invoice Footer Text</label>
                    <textarea name="footerText" id="footerText" value={settings.footerText} onChange={handleChange} rows={4} className="mt-1 block w-full p-2 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md shadow-sm" placeholder="e.g., Thank you for your business! Payment is due within 30 days."></textarea>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-700">Terms & Conditions</h3>
                    <div className="mt-2 space-y-2">
                        {(settings.termsAndConditions || []).map(term => (
                            <div key={term.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <p className="text-sm text-gray-800">{term.text}</p>
                                <button type="button" onClick={() => deleteTerm(term.id)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
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

                <div className="border-t pt-6">
                     <h3 className="text-lg font-semibold text-gray-700">Document Signatures</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                         <div>
                            <label htmlFor="preparedByLabel" className="block text-sm font-medium text-gray-700">"Prepared By" Label</label>
                            <input type="text" name="preparedByLabel" id="preparedByLabel" value={settings.preparedByLabel} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label htmlFor="authorizedSignatureLabel" className="block text-sm font-medium text-gray-700">"Authorized Signature" Label</label>
                            <input type="text" name="authorizedSignatureLabel" id="authorizedSignatureLabel" value={settings.authorizedSignatureLabel} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                     </div>
                     <div className="mt-4">
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
                </div>

                <div className="flex justify-end items-center pt-6 border-t">
                    {feedback && <p className="text-green-600 text-sm mr-4">{feedback}</p>}
                    <button type="submit" className="bg-brand-blue text-white px-6 py-2 rounded-md hover:bg-brand-blue-light transition-colors">Save Changes</button>
                </div>
            </form>
        </div>
        
        <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Invoice Preview</h3>
            <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-brand-blue flex flex-col h-full">
                <div className="flex-grow">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-brand-blue">{settings.name || 'ICON PRINTERS'}</h1>
                            <p className="text-sm text-gray-600 border-b-2 border-gray-800 pb-1">{settings.tagline || 'Deals in All Kinds of Printing Item'}</p>
                            <p className="text-sm font-semibold text-brand-blue mt-1 tracking-widest">{settings.services || 'DESIGN | PRINTING | SUPPLIERS'}</p>
                        </div>
                        <div className="text-right text-xs space-y-1">
                            <p className="flex justify-end items-center gap-2"><span className="font-semibold">{settings.address}</span><MapPin className="h-4 w-4 text-brand-blue" /></p>
                            <p className="flex justify-end items-center gap-2"><span className="font-semibold text-brand-blue">{settings.phone1}</span>, <span className="font-semibold text-brand-blue">{settings.phone2}</span><Phone className="h-4 w-4 text-brand-blue" /></p>
                            <p className="flex justify-end items-center gap-2"><span className="font-semibold">{settings.email}</span><Mail className="h-4 w-4 text-brand-blue" /></p>
                        </div>
                    </div>
                    <div className="h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        <p>Invoice Body Preview</p>
                    </div>
                </div>
                <div className="border-t mt-auto pt-4 text-center text-xs text-gray-500 whitespace-pre-wrap">
                    {settings.footerText}
                </div>
            </div>
        </div>
    </div>
  );
};

export default SettingsPage;
