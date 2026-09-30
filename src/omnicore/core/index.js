import { CustomerAdapter } from './CustomerAdapter';
import { TaskAdapter } from './TaskAdapter';
import { InvoiceAdapter } from './InvoiceAdapter';
import { ProductAdapter } from './ProductAdapter';
import { SupplierAdapter } from './SupplierAdapter';
import { TransactionAdapter } from './TransactionAdapter';
import { PaymentAdapter } from './PaymentAdapter';
import { EmployeeAdapter } from './EmployeeAdapter';
import { DocumentAdapter } from './DocumentAdapter';
import { ProjectAdapter } from './ProjectAdapter';
import { LocationAdapter } from './LocationAdapter';

/**
 * OmniCore Business Core Layer Module
 * Exposes core entity adapters and core primitives.
 */
export const BusinessCore = {
  initialized: true,
  layer: 'BusinessCore',
  adapters: {
    Customer: CustomerAdapter,
    Task: TaskAdapter,
    Invoice: InvoiceAdapter,
    Product: ProductAdapter,
    Supplier: SupplierAdapter,
    Transaction: TransactionAdapter,
    Payment: PaymentAdapter,
    Employee: EmployeeAdapter,
    Document: DocumentAdapter,
    Project: ProjectAdapter,
    Location: LocationAdapter
  }
};

export {
  CustomerAdapter,
  TaskAdapter,
  InvoiceAdapter,
  ProductAdapter,
  SupplierAdapter,
  TransactionAdapter,
  PaymentAdapter,
  EmployeeAdapter,
  DocumentAdapter,
  ProjectAdapter,
  LocationAdapter
};

export default BusinessCore;
