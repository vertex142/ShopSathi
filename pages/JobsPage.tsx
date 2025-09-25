import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { JobOrder, JobStatus } from '../types';
import JobOrderForm from '../components/JobOrderForm';
import StatusEditor from '../components/StatusEditor';
import JobKanbanBoard from '../components/JobKanbanBoard';
import JobDetailsModal from '../components/JobDetailsModal';
import { List, Trello, Calendar, FileSearch, Edit, Trash2, Briefcase } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import JobCalendarView from '../components/JobCalendarView';
import EmptyState from '../components/EmptyState';

type ViewMode = 'list' | 'kanban' | 'calendar';

const JobsPage: React.FC = React.memo(() => {
  const { state, dispatch } = useData();
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOrder | null>(null);
  const [jobForDetails, setJobForDetails] = useState<JobOrder | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const handleEdit = (job: JobOrder) => {
    setSelectedJob(job);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this job order?')) {
      dispatch({ type: 'DELETE_JOB_ORDER', payload: id });
    }
  };
  
  const handleAddNew = () => {
    setSelectedJob(null);
    setShowForm(true);
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.Completed:
      case JobStatus.Delivered:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case JobStatus.Printing:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case JobStatus.Designing:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case JobStatus.Pending:
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };
  
  const renderContent = () => {
    if (state.jobOrders.length === 0) {
        return (
            <EmptyState 
                Icon={Briefcase}
                title="No Jobs Found"
                message="Track your production pipeline by adding your first job order."
                action={{ label: 'Add New Job', onClick: handleAddNew }}
            />
        );
    }
    
    switch (viewMode) {
        case 'list':
            return (
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Job Name</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {state.jobOrders.map((job) => {
                                  const customer = state.customers.find(c => c.id === job.customerId);
                                  return (
                                      <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{job.jobName}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer?.name || 'N/A'}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{job.dueDate}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(job.price)}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                                              <StatusEditor
                                                  item={job}
                                                  status={job.status}
                                                  statusEnum={JobStatus}
                                                  updateActionType="UPDATE_JOB_ORDER"
                                                  getStatusColor={getStatusColor}
                                              />
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                               <div className="flex justify-end items-center space-x-1">
                                                    <button onClick={() => setJobForDetails(job)} className="text-blue-600 hover:text-blue-900 p-1" title="View Details"><FileSearch className="h-4 w-4"/></button>
                                                    <button onClick={() => handleEdit(job)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Edit Job"><Edit className="h-4 w-4"/></button>
                                                    <button onClick={() => handleDelete(job.id)} className="text-red-600 hover:text-red-900 p-1" title="Delete Job"><Trash2 className="h-4 w-4"/></button>
                                                </div>
                                          </td>
                                      </tr>
                                  )
                              })}
                          </tbody>
                      </table>
                  </div>
                </div>
            );
        case 'kanban':
            return <JobKanbanBoard onEdit={handleEdit} onDelete={handleDelete} onViewDetails={setJobForDetails} />;
        case 'calendar':
            return <JobCalendarView jobs={state.jobOrders} customers={state.customers} onViewDetails={setJobForDetails} />;
        default:
            return null;
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Job Orders</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 text-brand-blue dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300'}`} title="List View">
                <List className="h-5 w-5 inline-block" />
            </button>
            <button onClick={() => setViewMode('kanban')} className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-900 text-brand-blue dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300'}`} title="Kanban Board View">
                <Trello className="h-5 w-5 inline-block" />
            </button>
            <button onClick={() => setViewMode('calendar')} className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-900 text-brand-blue dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300'}`} title="Calendar View">
                <Calendar className="h-5 w-5 inline-block" />
            </button>
          </div>
          <button onClick={handleAddNew} className="bg-brand-blue dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-brand-blue-light dark:hover:bg-blue-500 transition-colors">
            Add New Job
          </button>
        </div>
      </div>

      {renderContent()}

      {showForm && (
        <JobOrderForm
          job={selectedJob}
          onClose={() => setShowForm(false)}
        />
      )}

      {jobForDetails && (
        <JobDetailsModal
            job={jobForDetails}
            onClose={() => setJobForDetails(null)}
            onEdit={handleEdit}
        />
      )}
    </div>
  );
});

export default JobsPage;