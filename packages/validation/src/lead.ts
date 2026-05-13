import { z } from 'zod';

export const leadSourceEnum = z.enum([
  'website',
  'referral',
  'trade_show',
  'social_media',
  'email_campaign',
  'other',
]);

export const leadStatusEnum = z.enum([
  'new',
  'contacted',
  'qualified',
  'won',
  'lost',
]);

export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'Tên không được để trống'),
  lastName: z.string().min(1, 'Họ không được để trống'),
  email: z.string().email('Email không hợp lệ').optional().nullable(),
  phone: z.string().regex(/^[0-9+\-\s()]{7,15}$/, 'Số điện thoại không hợp lệ').optional().nullable(),
  company: z.string().optional().nullable(),
  source: leadSourceEnum.default('other'),
  status: leadStatusEnum.default('new'),
  leadScore: z.number().min(0).max(100).optional(),
  industry: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  assignedToId: z.string().uuid('ID người phụ trách không hợp lệ').optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadSource = z.infer<typeof leadSourceEnum>;
export type LeadStatus = z.infer<typeof leadStatusEnum>;