import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  message: string;
  intent?: string;
  entities?: Record<string, string>;
  suggestions?: string[];
  actions?: { type: string; label: string; data?: Record<string, unknown> }[];
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly sessions = new Map<string, ChatMessage[]>();

  constructor(private readonly config: ConfigService) {}

  /** Process a user message and generate a response */
  async chat(tenantId: string, userId: string, message: string): Promise<ChatResponse> {
    const sessionId = `${tenantId}:${userId}`;
    const history = this.sessions.get(sessionId) || [];

    // Add user message to history
    history.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

    // Detect intent
    const intent = this.detectIntent(message);

    // Generate response based on intent
    let response: ChatResponse;

    switch (intent) {
      case 'order_status':
        response = await this.handleOrderStatus(message);
        break;
      case 'product_inquiry':
        response = await this.handleProductInquiry(message);
        break;
      case 'payment_help':
        response = await this.handlePaymentHelp(message);
        break;
      case 'account_help':
        response = await this.handleAccountHelp(message);
        break;
      case 'greeting':
        response = this.handleGreeting();
        break;
      default:
        response = await this.handleGeneral(message, history);
        break;
    }

    // Add assistant response to history
    history.push({ role: 'assistant', content: response.message, timestamp: new Date().toISOString() });
    this.sessions.set(sessionId, history.slice(-20)); // Keep last 20 messages

    return response;
  }

  /** Get chat history for a user */
  getHistory(tenantId: string, userId: string): ChatMessage[] {
    const sessionId = `${tenantId}:${userId}`;
    return this.sessions.get(sessionId) || [];
  }

  /** Clear chat history */
  clearHistory(tenantId: string, userId: string): void {
    const sessionId = `${tenantId}:${userId}`;
    this.sessions.delete(sessionId);
  }

  /** Detect user intent from message */
  private detectIntent(message: string): string {
    const lower = message.toLowerCase();

    // Order-related
    if (lower.includes('đơn hàng') || lower.includes('order') || lower.includes('trạng thái') || lower.includes('status') || lower.includes('giao hàng') || lower.includes('shipping')) {
      return 'order_status';
    }

    // Product-related
    if (lower.includes('sản phẩm') || lower.includes('product') || lower.includes('giá') || lower.includes('price') || lower.includes('tồn kho') || lower.includes('stock')) {
      return 'product_inquiry';
    }

    // Payment-related
    if (lower.includes('thanh toán') || lower.includes('payment') || lower.includes('hóa đơn') || lower.includes('invoice') || lower.includes('tiền') || lower.includes('money')) {
      return 'payment_help';
    }

    // Account-related
    if (lower.includes('tài khoản') || lower.includes('account') || lower.includes('mật khẩu') || lower.includes('password') || lower.includes('đăng nhập') || lower.includes('login')) {
      return 'account_help';
    }

    // Greeting
    if (lower.includes('xin chào') || lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('chào')) {
      return 'greeting';
    }

    return 'general';
  }

  private async handleOrderStatus(message: string): Promise<ChatResponse> {
    // Extract order code from message
    const orderCodeMatch = message.match(/(?:DH|ORD|ORDER)[-\s]?(\d+)/i);
    const orderCode = orderCodeMatch ? orderCodeMatch[0] : null;

    if (orderCode) {
      return {
        message: `Looking up order ${orderCode}... Please wait a moment.`,
        intent: 'order_status',
        entities: { orderCode },
        actions: [
          { type: 'view_order', label: 'chatbot.actions.viewOrder' },
          { type: 'track_shipment', label: 'chatbot.actions.trackShipment' },
        ],
      };
    }

    return {
      message: 'Please provide an order code (e.g., DH-001) so I can help you check the status.',
      intent: 'order_status',
      suggestions: ['DH-001', 'DH-002', 'chatbot.suggestions.viewAllOrders'],
    };
  }

  private async handleProductInquiry(message: string): Promise<ChatResponse> {
    return {
      message: 'I can help you search for products, check prices and inventory. What are you looking for?',
      intent: 'product_inquiry',
      suggestions: ['chatbot.suggestions.searchByName', 'chatbot.suggestions.searchBySKU', 'chatbot.suggestions.newProducts', 'chatbot.suggestions.promoProducts'],
      actions: [
        { type: 'search_products', label: 'chatbot.actions.searchProducts' },
        { type: 'view_categories', label: 'chatbot.actions.viewCategories' },
      ],
    };
  }

  private async handlePaymentHelp(message: string): Promise<ChatResponse> {
    return {
      message: 'I can help you with payment issues. What do you need assistance with?',
      intent: 'payment_help',
      suggestions: ['chatbot.suggestions.paymentMethods', 'chatbot.suggestions.paymentHistory', 'chatbot.suggestions.invoices', 'chatbot.suggestions.refunds'],
      actions: [
        { type: 'view_payments', label: 'chatbot.actions.viewPayments' },
        { type: 'view_invoices', label: 'chatbot.actions.viewInvoices' },
      ],
    };
  }

  private async handleAccountHelp(message: string): Promise<ChatResponse> {
    return {
      message: 'I can help you manage your account. What do you need assistance with?',
      intent: 'account_help',
      suggestions: ['chatbot.suggestions.changePassword', 'chatbot.suggestions.updateProfile', 'chatbot.suggestions.notifSettings', 'chatbot.suggestions.accessRights'],
      actions: [
        { type: 'edit_profile', label: 'chatbot.actions.editProfile' },
        { type: 'change_password', label: 'chatbot.actions.changePassword' },
      ],
    };
  }

  private handleGreeting(): ChatResponse {
    return {
      message: 'Hello! I am your Smart ERP virtual assistant. I can help you with:\n\n• Order lookup\n• Product search\n• Payment support\n• Account management\n\nHow can I help you today?',
      intent: 'greeting',
      suggestions: ['chatbot.suggestions.orderLookup', 'chatbot.suggestions.productSearch', 'chatbot.suggestions.paymentSupport', 'chatbot.suggestions.accountMgmt'],
    };
  }

  private async handleGeneral(message: string, history: ChatMessage[]): Promise<ChatResponse> {
    // In production, this would call an LLM API (OpenAI, Claude, etc.)
    const aiUrl = this.config.get('AI_CHATBOT_URL');

    if (aiUrl) {
      try {
        const response = await fetch(`${aiUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            history: history.slice(-10),
            system_prompt: 'You are a helpful ERP assistant. Answer in Vietnamese. Help with orders, products, payments, and account management.',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return { message: data.response, intent: 'general' };
        }
      } catch (error: any) {
        this.logger.warn(`AI chatbot service unavailable: ${error.message}`);
      }
    }

    // Fallback response
    return {
      message: 'Thank you for your message! I did not quite understand your question. You can try:\n\n• "Track order DH-001"\n• "Search for product [name]"\n• "Payment help"\n• "Account management"\n\nOr contact our hotline: 1900-xxxx for direct support.',
      intent: 'general',
      suggestions: ['chatbot.suggestions.orderLookup', 'chatbot.suggestions.productSearch', 'chatbot.suggestions.paymentSupport', 'chatbot.suggestions.contactHotline'],
    };
  }
}
