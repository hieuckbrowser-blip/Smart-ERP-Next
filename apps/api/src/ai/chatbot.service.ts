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
        message: `Đang tra cứu đơn hàng ${orderCode}... Vui lòng đợi trong giây lát.`,
        intent: 'order_status',
        entities: { orderCode },
        actions: [
          { type: 'view_order', label: 'Xem chi tiết đơn hàng' },
          { type: 'track_shipment', label: 'Theo dõi vận chuyển' },
        ],
      };
    }

    return {
      message: 'Bạn có thể cho tôi biết mã đơn hàng (ví dụ: DH-001) để tôi tra cứu trạng thái giúp bạn.',
      intent: 'order_status',
      suggestions: ['DH-001', 'DH-002', 'Xem tất cả đơn hàng'],
    };
  }

  private async handleProductInquiry(message: string): Promise<ChatResponse> {
    return {
      message: 'Tôi có thể giúp bạn tìm kiếm sản phẩm, kiểm tra giá và tồn kho. Bạn đang tìm sản phẩm nào?',
      intent: 'product_inquiry',
      suggestions: ['Tìm sản phẩm theo tên', 'Tìm theo SKU', 'Xem sản phẩm mới nhất', 'Sản phẩm khuyến mãi'],
      actions: [
        { type: 'search_products', label: 'Tìm kiếm sản phẩm' },
        { type: 'view_categories', label: 'Xem danh mục' },
      ],
    };
  }

  private async handlePaymentHelp(message: string): Promise<ChatResponse> {
    return {
      message: 'Tôi có thể giúp bạn với các vấn đề thanh toán. Bạn cần hỗ trợ gì?',
      intent: 'payment_help',
      suggestions: ['Phương thức thanh toán', 'Lịch sử thanh toán', 'Hóa đơn', 'Hoàn tiền'],
      actions: [
        { type: 'view_payments', label: 'Xem lịch sử thanh toán' },
        { type: 'view_invoices', label: 'Xem hóa đơn' },
      ],
    };
  }

  private async handleAccountHelp(message: string): Promise<ChatResponse> {
    return {
      message: 'Tôi có thể giúp bạn quản lý tài khoản. Bạn cần hỗ trợ gì?',
      intent: 'account_help',
      suggestions: ['Đổi mật khẩu', 'Cập nhật hồ sơ', 'Cài đặt thông báo', 'Quyền truy cập'],
      actions: [
        { type: 'edit_profile', label: 'Cập nhật hồ sơ' },
        { type: 'change_password', label: 'Đổi mật khẩu' },
      ],
    };
  }

  private handleGreeting(): ChatResponse {
    return {
      message: 'Xin chào! Tôi là trợ lý ảo của Smart ERP. Tôi có thể giúp bạn:\n\n• Tra cứu đơn hàng\n• Tìm kiếm sản phẩm\n• Hỗ trợ thanh toán\n• Quản lý tài khoản\n\nBạn cần giúp gì ạ?',
      intent: 'greeting',
      suggestions: ['Tra cứu đơn hàng', 'Tìm sản phẩm', 'Hỗ trợ thanh toán', 'Quản lý tài khoản'],
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
      message: 'Cảm ơn bạn đã nhắn tin! Tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể thử:\n\n• "Tra cứu đơn hàng DH-001"\n• "Tìm sản phẩm [tên sản phẩm]"\n• "Hỗ trợ thanh toán"\n• "Quản lý tài khoản"\n\nHoặc liên hệ hotline: 1900-xxxx để được hỗ trợ trực tiếp.',
      intent: 'general',
      suggestions: ['Tra cứu đơn hàng', 'Tìm sản phẩm', 'Hỗ trợ thanh toán', 'Liên hệ hotline'],
    };
  }
}
