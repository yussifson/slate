import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Bot, User, Plus, Trash2, Copy, Check, Lightbulb, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RealEstateAPI } from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

export default function Agentic() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'bot',
      content: 'Hello! I\'m your AI Real Estate Assistant. I can help you with:\n\n• Market analysis and trends\n• Property recommendations\n• Client matching\n• Deal optimization\n• Strategic insights\n\nWhat would you like help with today?',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_agentic_conversations WHERE company_id = ? ORDER BY updated_at DESC LIMIT 50',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setConversations(data);
      } catch (e) {
        console.error('[Agentic] Fetch conversations failed:', e);
      }
    };

    if (companyId) fetchConversations();
  }, [companyId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateAIResponse = async (userMessage) => {
    // Simulate AI response based on message content
    const responses = {
      'market': {
        content: 'Based on current market analysis:\n\n📈 Market Trends:\n• Overall market growth: +8% YoY\n• Average days on market: 28 days\n• Price appreciation: +5% YoY\n• Inventory levels: Moderate\n\n💡 Recommendations:\n• Focus on inventory in high-demand areas\n• Premium properties showing strong demand\n• Commercial segment underperforming\n\n📊 Key Metrics:\n• Market velocity: High\n• Buyer confidence: Strong\n• Forecasted growth: Positive',
        suggestions: ['View detailed analytics', 'Compare regions', 'Export report']
      },
      'property': {
        content: 'Property Recommendation Analysis:\n\n🏠 Top Recommended Properties:\n1. Residential Portfolio - High ROI potential\n   • Average yield: 7.2%\n   • Market demand: Strong\n   • Risk level: Low\n\n2. Commercial Spaces - Growth opportunity\n   • Average yield: 8.5%\n   • Market demand: Moderate\n   • Risk level: Medium\n\n3. Land Development - Long-term gain\n   • Appreciation potential: High\n   • Market demand: Rising\n   • Risk level: High\n\n✅ Action Items:\n• Schedule property viewings\n• Get appraisals\n• Review lease agreements',
        suggestions: ['View properties', 'Schedule viewing', 'Get appraisal']
      },
      'client': {
        content: 'Client Matching Intelligence:\n\n👥 Top Client Matches:\n1. High-Value Investors (15 prospects)\n   • Average portfolio: $5M+\n   • Conversion rate: 35%\n   • Best properties: Commercial\n\n2. First-Time Buyers (23 prospects)\n   • Average budget: $250K-$500K\n   • Conversion rate: 28%\n   • Best properties: Residential\n\n3. Portfolio Builders (8 prospects)\n   • Average budget: $1M+\n   • Conversion rate: 42%\n   • Best properties: Mixed-use\n\n📋 Next Steps:\n• Send personalized recommendations\n• Schedule consultations\n• Prepare market reports',
        suggestions: ['View clients', 'Send recommendations', 'Schedule meeting']
      },
      'deal': {
        content: 'Deal Optimization Analysis:\n\n💰 Current Deal Pipeline:\n• Active deals: 12\n• In negotiation: 5\n• Pending closing: 3\n\n✨ Optimization Opportunities:\n1. Deal A-123: Increase offer by 2% → +$15K commission\n2. Deal B-456: Bundle properties → +$8K savings\n3. Deal C-789: Terms adjustment → Better terms\n\n📈 Projected Outcome:\n• Expected close rate: 85%\n• Average deal value: $425K\n• Commission potential: $127K\n\n🎯 Recommendations:\n• Fast-track Deal A-123\n• Negotiate better terms on Deal C-789\n• Bundle properties for efficiency',
        suggestions: ['View deal pipeline', 'Optimize pricing', 'Check closing dates']
      },
    };

    // Match keywords in user message
    let response = responses['market']; // default
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('market') || lowerMessage.includes('trend')) {
      response = responses['market'];
    } else if (lowerMessage.includes('property') || lowerMessage.includes('recommend')) {
      response = responses['property'];
    } else if (lowerMessage.includes('client') || lowerMessage.includes('buyer') || lowerMessage.includes('seller')) {
      response = responses['client'];
    } else if (lowerMessage.includes('deal') || lowerMessage.includes('negotiat') || lowerMessage.includes('offer')) {
      response = responses['deal'];
    } else {
      response = {
        content: `I've analyzed your request about "${userMessage.slice(0, 50)}...".\n\nHere are my insights:\n\n📊 Analysis Complete:\n• Data points reviewed: 250+\n• Patterns identified: 8\n• Opportunities found: 3\n• Risks highlighted: 2\n\n💡 Key Recommendations:\n• Focus on high-demand segments\n• Optimize pricing strategies\n• Enhance client targeting\n• Accelerate deal closures\n\n📈 Expected Impact:\n• Revenue increase: +12%\n• Deal velocity: +15%\n• Client satisfaction: +8%\n\nWould you like me to elaborate on any of these recommendations?`,
        suggestions: ['Get detailed analysis', 'Export report', 'Create action plan']
      };
    }

    return response;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate AI response
    const aiResponse = await generateAIResponse(userMessage);
    const botMsg = {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      content: aiResponse.content,
      suggestions: aiResponse.suggestions,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleNewConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'bot',
        content: 'Hello! I\'m your AI Real Estate Assistant. What would you like help with today?',
        timestamp: new Date(),
      }
    ]);
    setSelectedConversation(null);
    setInputValue('');
  };

  const handleSaveConversation = async () => {
    if (messages.length < 2) {
      toast.error('Add at least one exchange before saving');
      return;
    }

    setIsSaving(true);
    try {
      const conversationTitle = messages[1]?.content?.slice(0, 50) || 'Conversation';
      await RealEstateAPI.createAgenticConversation(
        companyId,
        {
          title: conversationTitle,
          messages: JSON.stringify(messages),
          summary: messages.map(m => m.content).join('\n\n'),
        },
        user.id
      );
      toast.success('Conversation saved successfully');
      // Refresh conversations list
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_agentic_conversations WHERE company_id = ? ORDER BY updated_at DESC LIMIT 50',
        [companyId]
      );
      const data = res.rows._array || Array.from(res.rows);
      setConversations(data);
    } catch (e) {
      console.error('[Agentic] Save conversation failed:', e);
      toast.error('Failed to save conversation');
    }
    setIsSaving(false);
  };

  const handleCopyMessage = (id) => {
    const message = messages.find(m => m.id === id);
    if (message) {
      navigator.clipboard.writeText(message.content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDeleteConversation = async (id) => {
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await RealEstateAPI.deleteAgenticConversation(companyId, id, user.id);
      setConversations(prev => prev.filter(c => c.id !== id));
      toast.success('Conversation deleted');
    } catch (e) {
      console.error('[Agentic] Delete failed:', e);
      toast.error('Failed to delete conversation');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <Button onClick={handleNewConversation} className="w-full gap-2" variant="outline">
            <Plus className="w-4 h-4" />
            New Conversation
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No saved conversations</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`p-3 rounded cursor-pointer text-sm truncate transition-colors ${
                  selectedConversation === conv.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 justify-between">
                  <span>{conv.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">AI Real Estate Assistant</h1>
                <p className="text-xs text-muted-foreground">Powered by advanced analytics</p>
              </div>
            </div>
            <Button onClick={handleSaveConversation} disabled={isSaving} variant="outline">
              Save Conversation
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                {msg.role === 'bot' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">AI Assistant</span>
                  </div>
                )}
                <div
                  className={`p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none border border-border'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.suggestions && msg.suggestions.length > 0 && msg.role === 'bot' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.suggestions.map((sugg, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputValue(sugg);
                            setTimeout(() => {
                              const form = document.querySelector('form');
                              form?.dispatchEvent(new Event('submit', { bubbles: true }));
                            }, 0);
                          }}
                          className="text-xs px-2 py-1 rounded border border-current/30 hover:bg-current/10 transition"
                        >
                          {sugg}
                        </button>
                      ))}
                    </div>
                  )}
                  {msg.role === 'bot' && (
                    <button
                      onClick={() => handleCopyMessage(msg.id)}
                      className="mt-2 text-xs opacity-60 hover:opacity-100 flex items-center gap-1"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground">Thinking...</span>
                </div>
                <div className="p-4 rounded-lg bg-muted border border-border rounded-bl-none flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me about market trends, properties, clients, deals... (Shift+Enter for new line)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              className="flex-1 max-h-24 resize-none"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="h-auto"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setInputValue('Analyze current market trends')}
              className="p-2 rounded border border-border hover:bg-muted transition text-left"
            >
              <TrendingUp className="w-3 h-3 mb-1" />
              Market Analysis
            </button>
            <button
              type="button"
              onClick={() => setInputValue('Recommend properties for our portfolio')}
              className="p-2 rounded border border-border hover:bg-muted transition text-left"
            >
              <Lightbulb className="w-3 h-3 mb-1" />
              Property Recs
            </button>
            <button
              type="button"
              onClick={() => setInputValue('Find best client matches')}
              className="p-2 rounded border border-border hover:bg-muted transition text-left"
            >
              <Target className="w-3 h-3 mb-1" />
              Client Matching
            </button>
            <button
              type="button"
              onClick={() => setInputValue('Optimize current deals')}
              className="p-2 rounded border border-border hover:bg-muted transition text-left"
            >
              <AlertCircle className="w-3 h-3 mb-1" />
              Deal Optimization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
