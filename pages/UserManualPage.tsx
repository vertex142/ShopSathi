import React from 'react';
import { LayoutDashboard, FileText, Users, Package, Bot, Settings, AreaChart, Briefcase, ClipboardCheck } from 'lucide-react';

interface ManualCardProps {
  IconComponent: React.ElementType;
  title: string;
  children: React.ReactNode;
}

const ManualCard: React.FC<ManualCardProps> = ({ IconComponent, title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-center space-x-4 mb-4">
      <div className="bg-brand-blue-light text-white p-3 rounded-full">
        <IconComponent className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="text-gray-600 space-y-2">
      {children}
    </div>
  </div>
);

const UserManualPage: React.FC = React.memo(() => {
  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">User Manual</h1>
        <p className="mt-2 text-lg text-gray-600">Welcome to ShopSathi! Here’s a guide to help you get started and make the most of the features.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ManualCard IconComponent={LayoutDashboard} title="Dashboard">
          <p>Your central hub for a quick overview of your business health. View monthly income vs. expenses, total dues, and see recent activities at a glance.</p>
        </ManualCard>

        <ManualCard IconComponent={FileText} title="Invoices">
          <p>Create, manage, and track professional invoices. You can add payments, send invoices via email (simulation), and convert them to delivery challans.</p>
          <ul className="list-disc list-inside pl-4 text-sm">
            <li>Click 'Add New Invoice' to start.</li>
            <li>Use filters to search and sort.</li>
            <li>Add payments to update invoice status automatically.</li>
          </ul>
        </ManualCard>

        <ManualCard IconComponent={ClipboardCheck} title="Quotes">
          <p>Create and send quotes to potential customers. Once a quote is accepted, you can seamlessly convert it into a Job Order or an Invoice.</p>
          <ul className="list-disc list-inside pl-4 text-sm">
            <li>Set the status to 'Accepted' to enable conversion options.</li>
            <li>Converted quotes are automatically linked for easy tracking.</li>
          </ul>
        </ManualCard>

        <ManualCard IconComponent={Briefcase} title="Jobs">
          <p>Manage your production workflow using job orders. Track each job from 'Pending' to 'Delivered' using either a list view or a Kanban board.</p>
          <ul className="list-disc list-inside pl-4 text-sm">
            <li>Drag and drop jobs on the Kanban board to update their status.</li>
            <li>Assign inventory materials to jobs to track costs.</li>
          </ul>
        </ManualCard>

        <ManualCard IconComponent={Users} title="Customers">
          <p>Keep a detailed record of all your customers. View a customer's profile to see their complete history, including all invoices, quotes, and their account ledger.</p>
        </ManualCard>

        <ManualCard IconComponent={Package} title="Inventory">
          <p>Track your stock levels, costs, and suppliers. The system will alert you when items are running low based on the re-order level you set.</p>
        </ManualCard>

        <ManualCard IconComponent={AreaChart} title="Reports">
          <p>Gain insights into your business performance. The Financial Overview provides charts on income, expenses, and customer value. The General Ledger gives a detailed transaction history for any account.</p>
        </ManualCard>

        <ManualCard IconComponent={Bot} title="AI Assistant">
          <p>Your smart helper! Click the sparkle icon to ask questions about your business data in plain English. The AI has access to your current data to provide accurate answers.</p>
          <ul className="list-disc list-inside pl-4 text-sm">
            <li>Try asking: "Who are my top 3 customers by total billed?"</li>
            <li>Or: "Draft a payment reminder for overdue invoices."</li>
          </ul>
        </ManualCard>

        <ManualCard IconComponent={Settings} title="Settings">
          <p>Customize the application to fit your company. Add your company logo, address, contact details, and define standard terms and conditions for your documents.</p>
        </ManualCard>
      </div>
    </div>
  );
});

export default UserManualPage;
