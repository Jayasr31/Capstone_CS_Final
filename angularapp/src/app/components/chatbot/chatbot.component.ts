import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';

interface ChatMessage {
  from: 'bot' | 'user';
  text: string;
  time: string;
}

interface QuickReply {
  label: string;
  query: string;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatBody') chatBody!: ElementRef;

  isOpen = false;
  userInput = '';
  isTyping = false;
  messages: ChatMessage[] = [];

  quickReplies: QuickReply[] = [
    { label: '🏛️ View Halls', query: 'How do I view party halls?' },
    { label: '📅 Book a Hall', query: 'How do I book a hall?' },
    { label: '💰 Pricing', query: 'How is pricing calculated?' },
    { label: '❌ Cancel Booking', query: 'How do I cancel a booking?' },
    { label: '🎨 Themes', query: 'What themes are available?' },
    { label: '📞 Contact', query: 'How can I contact support?' }
  ];

  private readonly knowledge: { patterns: RegExp[]; answer: string }[] = [
    {
      patterns: [/book|reserve|booking/i],
      answer:
        'To book a hall:\n1. Go to "Browse Halls"\n2. Click on a hall you like\n3. In the popup, choose your dates and number of guests\n4. Click "Confirm Booking"\n\nYour booking will be pending until confirmed by the admin. 🎉'
    },
    {
      patterns: [/view|browse|see|find|hall|venue/i],
      answer:
        'You can browse all available party halls by clicking "Browse Halls" in the navigation bar. Use the filters to search by location, capacity, price, or theme. Click any hall card to view full details and book! 🏛️'
    },
    {
      patterns: [/price|cost|fee|charge|rate|pricing/i],
      answer:
        'Pricing is per day. Each hall has its own daily rate displayed on the hall card (₹). Your total is calculated as:\n\n**Total = Price per Day × Number of Days**\n\nYou can see the exact total in the booking summary before confirming. 💰'
    },
    {
      patterns: [/cancel|cancell|refund/i],
      answer:
        'To cancel a booking:\n1. Go to "My Bookings"\n2. Find the booking you want to cancel\n3. Click "Details" then "Cancel Booking"\n\nNote: Only **Pending** bookings can be cancelled. Confirmed bookings need admin assistance. ❌'
    },
    {
      patterns: [/theme|style|decor|decoration/i],
      answer:
        'CelebrateSpot offers a variety of themes:\n• 👑 Royal\n• 🏙️ Modern\n• 🌿 Garden\n• 🎩 Classic\n• 💎 Luxury\n• 🌾 Rustic\n• 🏖️ Beach\n• 🏭 Industrial\n\nFilter halls by theme in the Browse Halls page! 🎨'
    },
    {
      patterns: [/contact|support|help|assist|reach/i],
      answer:
        'For support, please contact us:\n📧 support@celebratespot.com\n📞 +91 83830 83602\n\nOur team is available Mon–Sat, 9AM–6PM. We typically respond within 24 hours. 🌟'
    },
    {
      patterns: [/status|pending|confirm|approved/i],
      answer:
        'Booking statuses:\n• **Pending** – Awaiting admin confirmation\n• **Confirmed** – Approved! You\'re all set 🎊\n• **Cancelled** – Booking was cancelled\n\nYou can view all your booking statuses in "My Bookings".'
    },
    {
      patterns: [/register|sign.?up|create.?account/i],
      answer:
        'To register:\n1. Click "Register" in the navigation bar\n2. Fill in your name, email, mobile number and password\n3. Submit and you\'re ready to book halls! 🎉'
    },
    {
      patterns: [/login|sign.?in|log.?in/i],
      answer:
        'To login:\n1. Click "Login" in the navigation bar\n2. Enter your registered email and password\n3. You\'ll be redirected to your dashboard\n\nForgot your password? Contact our support team. 🔑'
    },
    {
      patterns: [/capacity|guest|person|people|attendee/i],
      answer:
        'Each party hall has a maximum capacity listed on the hall card. When booking, you cannot exceed the hall\'s capacity. The booking form shows a real-time capacity indicator so you always know availability! 👥'
    },
    {
      patterns: [/review|rating|feedback|testimonial/i],
      answer:
        'After enjoying an event at a CelebrateSpot venue, you can leave a review:\n1. Go to the hall\'s detail page\n2. Scroll to the "Add Review" section\n3. Rate the hall (1–5 stars) and write your feedback\n\nYour reviews help other customers! ⭐'
    },
    {
      patterns: [/admin|manage|dashboard/i],
      answer:
        'Admins have access to a dedicated dashboard where they can:\n• Add/edit/delete party halls\n• Manage all bookings (confirm or track)\n• View all customer reviews\n• Monitor platform statistics 📊'
    },
    {
      patterns: [/hello|hi|hey|good morning|good afternoon|good evening|greet/i],
      answer:
        'Hello! 👋 Welcome to CelebrateSpot! I\'m your virtual assistant, here to help you find the perfect venue for your celebration.\n\nWhat can I help you with today?'
    },
    {
      patterns: [/thank|thanks|great|awesome|perfect|helpful/i],
      answer:
        'You\'re welcome! 😊 Happy to help. Is there anything else you\'d like to know about CelebrateSpot? Feel free to ask anytime!'
    },
    {
      patterns: [/bye|goodbye|see you|later/i],
      answer:
        'Goodbye! Have a wonderful celebration! 🎊 Feel free to chat anytime you need help. CelebrateSpot is always here for you!'
    }
  ];

  ngOnInit(): void {
    setTimeout(() => {
      this.pushBotMessage(
        'Hi there! 👋 I\'m the CelebrateSpot Assistant.\n\nI can help you with bookings, pricing, hall themes, and more. What would you like to know?'
      );
    }, 500);
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(text?: string): void {
    const query = (text || this.userInput).trim();
    if (!query) return;

    this.pushUserMessage(query);
    this.userInput = '';
    this.isTyping = true;

    setTimeout(() => {
      const answer = this.getAnswer(query);
      this.isTyping = false;
      this.pushBotMessage(answer);
    }, 800);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private getAnswer(query: string): string {
    for (const item of this.knowledge) {
      if (item.patterns.some(p => p.test(query))) {
        return item.answer;
      }
    }
    return 'I\'m not sure about that. Here are some things I can help with:\n• Booking a hall\n• Pricing & capacity\n• Cancellations\n• Hall themes\n• Contact & support\n\nTry one of the quick reply buttons below, or ask in a different way! 😊';
  }

  private pushBotMessage(text: string): void {
    this.messages.push({ from: 'bot', text, time: this.getTime() });
  }

  private pushUserMessage(text: string): void {
    this.messages.push({ from: 'user', text, time: this.getTime() });
  }

  private getTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      if (this.chatBody) {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }
    } catch {}
  }
}
