# @smart-erp/accounting

Comprehensive accounting module for Smart ERP Next - Vietnamese compliance ready.

## Features

### Chart of Accounts (`chart-of-accounts/`)
- Hierarchical account structure (parent-child relationships)
- Account types: Asset, Liability, Equity, Revenue, Expense
- Support for both Vietnamese and English account names
- Balance tracking per account

### Voucher Types (`voucher-types/`)
- Predefined types: Payment, Receipt, Journal, Invoice, Credit/Debit Note
- Auto-numbering with customizable prefixes
- Required/optional field configuration

### Journal Entries (`journal-entry/`)
- Double-entry bookkeeping (debit/credit balance validation)
- Multi-line entries with tax support
- Cost center and project tracking
- Posting workflow with reversal support

### VAT (`vat/`)
- Vietnamese VAT rates (0%, 5%, 10%)
- Monthly/quarterly declarations
- Output/Input VAT tracking

### Financial Reports (`financial-reports/`)
- Balance Sheet
- Income Statement (P&L)
- Cash Flow Statement
- Trial Balance

### Tax Declarations (`tax-declaration/`)
- Income tax calculations
- Withholding tax
- Compliance tracking

### Depreciation (`depreciation/`)
- Fixed asset management
- Straight-line and declining methods
- Depreciation schedule generation

### Currency Conversion (`currency-conversion/`)
- Multi-currency support
- Exchange rate management
- Real-time conversion calculations

## Usage

```typescript
import {
  ChartOfAccountDTO,
  JournalEntryDTO,
  VatRateDTO,
  DEFAULT_VAT_RATES,
  DEFAULT_ACCOUNTS,
} from '@smart-erp/accounting';

// Use DTOs for API communication
const account: ChartOfAccountDTO = {
  accountCode: '1111',
  accountName: 'Tiền mặt',
  accountType: 'asset',
};

// Use validation schemas with Zod
import { chartOfAccountSchema } from '@smart-erp/accounting';
const validated = chartOfAccountSchema.parse(data);
```

## Database Schema

All schemas use Drizzle ORM with:
- UUID primary keys
- Tenant isolation (`tenantId` on all tables)
- Timestamps (`createdAt`, `updatedAt`)
- Soft deletes via `isActive` flags where appropriate

## Vietnamese Compliance

- All user-facing text uses i18n keys (see `@smart-erp/i18n`)
- VAT rates match Vietnamese tax law (0%, 5%, 10%)
- Financial reports follow Vietnamese accounting standards
- Currency defaults to VND

## Installation

```bash
pnpm add @smart-erp/accounting
```

## Dependencies

- `@smart-erp/types`
- `@smart-erp/validation`
- `zod`