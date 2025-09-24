import React from 'react';
import { LayoutDashboard, FileText, Users, Package, Bot, Settings, AreaChart, Briefcase, ClipboardCheck, Printer, ShoppingCart, TrendingDown, Library, ArrowRight } from 'lucide-react';

interface ManualSectionProps {
  IconComponent: React.ElementType;
  title: string;
  children: React.ReactNode;
}

const ManualSection: React.FC<ManualSectionProps> = ({ IconComponent, title, children }) => (
  <section className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-center space-x-4 mb-4">
      <div className="bg-brand-blue-light text-white p-3 rounded-full">
        <IconComponent className="h-8 w-8" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="text-gray-600 space-y-4 prose max-w-none prose-sm prose-a:text-brand-blue hover:prose-a:underline">
      {children}
    </div>
  </section>
);

interface WorkflowStepProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  isLast?: boolean;
}

const WorkflowStep: React.FC<WorkflowStepProps> = ({ icon, title, children, isLast = false }) => (
  <div className="flex">
    <div className="flex flex-col items-center mr-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 border-2 border-white shadow-md text-brand-blue">
          {icon}
      </div>
      {!isLast && <div className="w-px h-full bg-gray-300 my-2"></div>}
    </div>
    <div className={`pb-8 ${isLast ? '' : 'pt-1'}`}>
      <p className="mb-2 text-xl font-semibold text-gray-800">{title}</p>
      <div className="text-gray-600 space-y-2">{children}</div>
    </div>
  </div>
);

const UserManualPage: React.FC = React.memo(() => {
  return (
    <div className="container mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-gray-800">Welcome to ShopSathi!</h1>
        <p className="mt-2 text-lg text-gray-600">This guide will walk you through the key features to help you manage your business efficiently.</p>
      </div>

      <ManualSection IconComponent={LayoutDashboard} title="Getting Started: The Dashboard">
          <p>The <strong>Dashboard</strong> is your command center. It provides a real-time snapshot of your business's financial health and activities. Here's what you can see:</p>
          <ul>
              <li><strong>Key Metrics:</strong> Instantly view your income for the current month, total outstanding dues from customers, and your monthly expenses.</li>
              <li><strong>Quick Actions:</strong> Jump directly into creating a new invoice, customer, purchase order, or expense right from the dashboard.</li>
              <li><strong>Financial Overview:</strong> A visual chart comparing your income and expenses over the last six months, helping you spot trends.</li>
              <li><strong>Recent Activity:</strong> Keep an eye on the latest invoices and expenses without leaving the page.</li>
          </ul>
      </ManualSection>
      
      <ManualSection IconComponent={ArrowRight} title="The Sales Workflow">
        <p>Our sales process is designed to be seamless, from initial quotation to final payment. Follow these steps to manage your sales pipeline effectively.</p>
        <div className="mt-6 -ml-6">
            <WorkflowStep icon={<ClipboardCheck className="h-8 w-8" />} title="1. Create a Quote">
              <p>The first step is to provide a potential customer with a professional quotation for your products or services.</p>
              <ul className="list-disc list-inside">
                  <li>Navigate to the <strong>Quotes</strong> page from the sidebar.</li>
                  <li>Click "Add New Quote" and fill in the customer details, items, rates, and quantities.</li>
                  <li>You can select predefined Terms & Conditions from your settings.</li>
                  <li>Save the quote. Its initial status will be 'DRAFT'. You can change it to 'SENT' after sending it to your customer.</li>
              </ul>
            </WorkflowStep>

            <WorkflowStep icon={<Briefcase className="h-8 w-8" />} title="2. Convert to a Job or Invoice">
              <p>Once the customer accepts your quote, you can convert it into a Job Order for production or directly into an Invoice for billing.</p>
              <ul className="list-disc list-inside">
                  <li>Find the quote and change its status to 'ACCEPTED'.</li>
                  <li>New action buttons will appear: "To Job" and "To Invoice".</li>
                  <li><strong>To Job:</strong> Creates a new Job Order pre-filled with the quote's details, ready for your production team.</li>
                  <li><strong>To Invoice:</strong> Creates a new draft Invoice, perfect for projects that don't require internal job tracking.</li>
              </ul>
            </WorkflowStep>
            
             <WorkflowStep icon={<FileText className="h-8 w-8" />} title="3. Manage the Invoice">
              <p>Invoices are the core of your billing. Track their status, record payments, and ensure you get paid on time.</p>
              <ul className="list-disc list-inside">
                  <li>Go to the <strong>Invoices</strong> page to see all your invoices.</li>
                  <li>When a customer pays, click "Add Payment" on the corresponding invoice.</li>
                  <li>The invoice status will automatically update from 'SENT' to 'PARTIALLY_PAID' or 'PAID' based on the payment amount.</li>
              </ul>
            </WorkflowStep>

            <WorkflowStep icon={<Printer className="h-8 w-8" />} title="4. Print & Share Documents" isLast>
                <p>All your documents—Quotes, Invoices, Purchase Orders, and Reports—can be easily printed or saved as professional PDFs.</p>
                 <ul className="list-disc list-inside">
                  <li>Click the "Preview" button on any document list.</li>
                  <li>In the preview modal, click "Print / Save PDF".</li>
                  <li>Your browser's print dialog will appear. To save a high-quality PDF, choose <strong>"Save as PDF"</strong> as the destination.</li>
              </ul>
            </WorkflowStep>
        </div>
      </ManualSection>

      <ManualSection IconComponent={Package} title="Production & Purchasing">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4>Jobs Management</h4>
              <p>Track every project from start to finish. Use the <strong>Jobs</strong> page to manage your production queue.</p>
              <ul className="list-disc list-inside">
                  <li><strong>List View:</strong> A traditional table view of all jobs.</li>
                  <li><strong>Kanban View:</strong> A visual, drag-and-drop board to move jobs through statuses like 'Designing', 'Printing', and 'Completed'.</li>
                  <li><strong>Costing:</strong> Use the Job Cost Calculator to break down estimated vs. actual costs for paper, printing, labor, and more to understand each job's profitability.</li>
              </ul>
            </div>
             <div>
              <h4>Inventory & Suppliers</h4>
              <p>Manage your stock and purchasing seamlessly.</p>
              <ul className="list-disc list-inside">
                  <li><strong>Inventory:</strong> Add all your stock items, set re-order levels, and receive low-stock notifications on your dashboard. Stock levels are automatically deducted when linked jobs are completed.</li>
                  <li><strong>Suppliers & POs:</strong> Manage your vendors on the <strong>Suppliers</strong> page. Create <strong>Purchase Orders (POs)</strong> to formally order new stock. Mark POs as 'Completed' to automatically increase your inventory levels.</li>
              </ul>
            </div>
        </div>
      </ManualSection>

      <ManualSection IconComponent={Library} title="Financial Management">
        <p>Keep your finances in order with integrated accounting tools. All financial transactions are automatically recorded through invoices, expenses, and payments.</p>
          <ul>
            <li><strong>Chart of Accounts:</strong> Found under <strong>Accounts</strong>, this is the list of all your financial accounts (Assets, Liabilities, Revenue, etc.). You can add your own accounts and set opening balances.</li>
            <li><strong>Expenses:</strong> Record all your business expenses on the <strong>Expenses</strong> page. Each expense is a transaction that correctly debits an expense account and credits an asset account (like Cash or Bank).</li>
            <li><strong>Journal Entries:</strong> For advanced accounting, you can make manual adjustments using standard double-entry bookkeeping on the <strong>Journal Entries</strong> page.</li>
            <li><strong>Reports:</strong> The <strong>Reports</strong> page gives you powerful insights, including a Financial Overview, a General Ledger for any account, and a Profit & Loss statement.</li>
        </ul>
      </ManualSection>

      <ManualSection IconComponent={Bot} title="Advanced Features">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4>AI Assistant</h4>
              <p>Click the sparkle icon (<Bot className="inline h-4 w-4"/>) to chat with your AI Assistant. It can analyze your business data to answer questions and perform tasks.</p>
              <p><strong>Example questions:</strong></p>
              <ul className="list-disc list-inside">
                  <li>"Which invoices are overdue?"</li>
                  <li>"Who are my top 3 customers by total paid?"</li>
                  <li>"Draft a reminder email for unpaid invoices."</li>
              </ul>
            </div>
             <div>
              <h4>Settings & Data Management</h4>
              <p>Customize the app on the <strong>Settings</strong> page. Add your company details, logo, and signature for documents.</p>
              <p><strong>Crucially, you can manage your data:</strong></p>
               <ul className="list-disc list-inside">
                  <li><strong>Export:</strong> Regularly export your data to create a backup file.</li>
                  <li><strong>Import:</strong> Restore your data from a backup file. <strong>Warning:</strong> This overwrites all current data.</li>
                  <li><strong>Reset:</strong> Permanently delete all data to start fresh. <strong>Use with extreme caution!</strong></li>
              </ul>
            </div>
        </div>
      </ManualSection>
    </div>
  );
});

export default UserManualPage;
