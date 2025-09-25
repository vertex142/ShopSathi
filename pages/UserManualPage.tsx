import React from 'react';
import { LayoutDashboard, FileText, Users, Package, Bot, Settings, AreaChart, Briefcase, ClipboardCheck, Printer, ShoppingCart, TrendingDown, Library, ArrowRight, BookCopy } from 'lucide-react';

interface ManualSectionProps {
  IconComponent: React.ElementType;
  title: string;
  children: React.ReactNode;
}

const ManualSection: React.FC<ManualSectionProps> = ({ IconComponent, title, children }) => (
  <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-center space-x-4 mb-4">
      <div className="bg-brand-blue-light dark:bg-blue-600 text-white p-3 rounded-full">
        <IconComponent className="h-8 w-8" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">{title}</h3>
    </div>
    <div className="text-gray-600 dark:text-gray-300 space-y-4 prose max-w-none prose-sm dark:prose-invert prose-a:text-brand-blue dark:prose-a:text-blue-400 hover:prose-a:underline">
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
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 shadow-md text-brand-blue dark:text-blue-400">
          {icon}
      </div>
      {!isLast && <div className="w-px h-full bg-gray-300 dark:bg-gray-600 my-2"></div>}
    </div>
    <div className={`pb-8 ${isLast ? '' : 'pt-1'}`}>
      <p className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">{title}</p>
      <div className="text-gray-600 dark:text-gray-300 space-y-2">{children}</div>
    </div>
  </div>
);

const UserManualPage: React.FC = React.memo(() => {
  return (
    <div className="container mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">ShopSathi User Manual</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Your comprehensive guide to mastering the application and managing your business with ease.</p>
      </div>

      <ManualSection IconComponent={LayoutDashboard} title="Getting Started: The Dashboard">
          <p>The <strong>Dashboard</strong> is your command center. It provides a real-time snapshot of your business's financial health and activities. Here's what you can see:</p>
          <ul>
              <li><strong>Key Metrics:</strong> Instantly view your <strong>Income</strong> (payments received this month), <strong>Total Dues</strong> (outstanding balance from all customers), and <strong>Expenses</strong> (total recorded this month).</li>
              <li><strong>Quick Actions:</strong> Jump directly into creating a new invoice, customer, purchase order, or expense right from the dashboard.</li>
              <li><strong>Financial Overview:</strong> A visual chart comparing your income and expenses over the last six months, helping you spot trends. Hover over the chart for exact figures.</li>
              <li><strong>Recent Activity:</strong> Keep an eye on the latest invoices and expenses without leaving the page.</li>
              <li><strong>AI Actions:</strong> If you've configured an API key, the system will provide actionable insights, such as drafting reminder emails for overdue invoices.</li>
          </ul>
      </ManualSection>
      
      <ManualSection IconComponent={Settings} title="Initial Setup: Settings">
        <p>Before you start, it's crucial to configure your company details. Navigate to the <strong>Settings</strong> page from the sidebar.</p>
        <ul>
            <li><strong>Document Header:</strong> Upload your company logo or letterhead as an SVG file. This will appear at the top of all your documents.</li>
            <li><strong>Document Customization:</strong> Add a default footer text for invoices and upload a signature image to automatically sign documents.</li>
            <li><strong>Terms & Conditions:</strong> We've pre-loaded some essential terms for invoices, quotes, and purchase orders. You can customize, add, or delete these to fit your business needs. These terms can be selected when creating the respective documents.</li>
        </ul>
      </ManualSection>

      <ManualSection IconComponent={ArrowRight} title="Core Workflow: From Quote to Cash">
        <p>Our sales process is designed to be seamless, from initial quotation to final payment. Follow these steps to manage your sales pipeline effectively.</p>
        <div className="mt-6 -ml-6">
            <WorkflowStep icon={<ClipboardCheck className="h-8 w-8" />} title="1. Create a Quote">
              <p>The first step is to provide a potential customer with a professional quotation for your products or services.</p>
              <ul className="list-disc list-inside">
                  <li>Navigate to the <strong>Quotes</strong> page from the sidebar.</li>
                  <li>Click "Add New Quote" and fill in the details. You can select an existing customer or create a new one on the fly.</li>
                  <li>Add line items. You can select from your inventory or type them manually.</li>
                  <li>Select your pre-defined Terms & Conditions from the multiselect box (Hold <code>Ctrl</code>/<code>Cmd</code> to select multiple).</li>
                  <li>Save the quote. Its initial status will be 'DRAFT'. Change it to 'SENT' after sending it to your customer.</li>
              </ul>
            </WorkflowStep>

            <WorkflowStep icon={<Briefcase className="h-8 w-8" />} title="2. Convert to a Job or Invoice">
              <p>Once the customer accepts your quote, you can convert it into a Job Order for production or directly into an Invoice for billing.</p>
              <ul className="list-disc list-inside">
                  <li>Find the accepted quote and change its status to 'ACCEPTED'.</li>
                  <li>New action buttons will appear: "Convert to Job" and "Convert to Invoice".</li>
                  <li><strong>To Job:</strong> This is for work that requires production tracking. It creates a new entry on the <strong>Jobs</strong> page, pre-filled with the quote's details.</li>
                  <li><strong>To Invoice:</strong> This is for simple sales. It creates a new draft Invoice on the <strong>Invoices</strong> page.</li>
              </ul>
            </WorkflowStep>
            
             <WorkflowStep icon={<FileText className="h-8 w-8" />} title="3. Manage the Invoice & Payments">
              <p>Invoices are the core of your billing. Track their status, record payments, and ensure you get paid on time.</p>
              <ul className="list-disc list-inside">
                  <li>Go to the <strong>Invoices</strong> page. Here you can edit, preview, or delete invoices.</li>
                  <li>When a customer pays, click "Add Payment" on the corresponding invoice. Record the amount, date, and which account the money was deposited into.</li>
                  <li>The invoice status will automatically update to 'PARTIALLY_PAID' or 'PAID' based on the payment. You cannot manually set these statuses.</li>
              </ul>
            </WorkflowStep>

            <WorkflowStep icon={<Printer className="h-8 w-8" />} title="4. Print & Share Documents" isLast>
                <p>All your documents—Quotes, Invoices, Purchase Orders, and Reports—can be easily printed or saved as professional PDFs.</p>
                 <ul className="list-disc list-inside">
                  <li>Click the "Preview" button on any document list (e.g., Invoices page).</li>
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
                  <li><strong>Kanban View:</strong> A visual, drag-and-drop board to move jobs through statuses like 'Designing', 'Printing', and 'Completed'.</li>
                  <li><strong>Costing:</strong> In the job form, use the "Manage Costs" button to open the Job Cost Calculator. Here you can break down estimated vs. actual costs for paper, printing, labor, and more to understand each job's profitability.</li>
                   <li><strong>Inventory Consumption:</strong> When creating a job, link the materials used from your inventory. The stock will be automatically deducted when the job status is changed to 'Completed' or 'Delivered'.</li>
              </ul>
            </div>
             <div>
              <h4>Inventory & Suppliers</h4>
              <p>Manage your stock and purchasing seamlessly.</p>
              <ul className="list-disc list-inside">
                  <li><strong>Inventory:</strong> Add all your stock items on the <strong>Inventory</strong> page. Set re-order levels to get low-stock notifications on your dashboard.</li>
                  <li><strong>Suppliers & POs:</strong> Manage your vendors on the <strong>Suppliers</strong> page. Create <strong>Purchase Orders (POs)</strong> to formally order new stock. When you receive the items, update the PO status to 'Completed' to automatically increase your inventory levels.</li>
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
      
       <ManualSection IconComponent={BookCopy} title="Frequently Asked Questions (FAQ)">
            <div className="space-y-4">
                <div>
                    <strong>How do I set my company's initial financial state?</strong>
                    <p>When you first start, you need to set the opening balances for your accounts. Go to <strong>Finance &gt; Accounts</strong>. Edit each account (like 'Cash on Hand') and enter the real-world balance into the "Opening Balance" field. This is separate from transactional balances.</p>
                </div>
                <div>
                    <strong>A customer already owed me money before I used this app. How do I record that?</strong>
                    <p>Go to <strong>Sales &gt; Customers</strong> and edit the specific customer. Enter the amount they owed you in the "Opening Balance" field. This will be automatically added as 'Previous Due' on their next invoice.</p>
                </div>
                 <div>
                    <strong>Why can't I change an invoice's status to 'Paid'?</strong>
                    <p>The 'Paid' and 'Partially Paid' statuses are controlled automatically. To mark an invoice as paid, you must record a payment against it using the "Add Payment" button. This ensures your accounting records remain accurate.</p>
                </div>
                 <div>
                    <strong>What's the difference between a Job and an Invoice?</strong>
                    <p>A <strong>Job</strong> is for internal production tracking. Use it for projects that have multiple stages (design, print, finish). An <strong>Invoice</strong> is purely for billing the customer. You can create an invoice directly, or convert a job into an invoice once it's ready to be billed.</p>
                </div>
                 <div>
                    <strong>How do I save a PDF?</strong>
                    <p>On any document preview screen, click "Print / Save PDF". In your browser's print dialog that appears, change the "Destination" or "Printer" to "Save as PDF".</p>
                </div>
            </div>
        </ManualSection>
    </div>
  );
});

export default UserManualPage;