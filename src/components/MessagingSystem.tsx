import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, Search } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface Conversation {
  userId: string;
  userName: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: string;
}

export function MessagingSystem({ currentUserId }: { currentUserId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${currentUserId}`
      }, () => {
        fetchConversations();
        if (selectedConversation) {
          fetchMessages(selectedConversation);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedConversation]);

  const fetchConversations = async () => {
    try {
      const { data: sentMessages } = await supabase
        .from('messages' as any)
        .select('*, profiles!messages_recipient_id_fkey(full_name)')
        .eq('sender_id', currentUserId)
        .order('created_at', { ascending: false });

      const { data: receivedMessages } = await supabase
        .from('messages' as any)
        .select('*, profiles!messages_sender_id_fkey(full_name)')
        .eq('recipient_id', currentUserId)
        .order('created_at', { ascending: false });

      // Combine and group by user
      const allMessages = [...(sentMessages || []), ...(receivedMessages || [])];
      const conversationMap = new Map<string, Conversation>();

      allMessages.forEach((msg: any) => {
        const otherUserId = msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            userId: otherUserId,
            userName: msg.profiles?.full_name || 'Unknown User',
            lastMessage: msg.message,
            unreadCount: 0,
            timestamp: msg.created_at
          });
        }

        if (msg.recipient_id === currentUserId && !msg.read) {
          const conv = conversationMap.get(otherUserId)!;
          conv.unreadCount++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('messages' as any)
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data as any);
        
        // Mark messages as read
        await supabase
          .from('messages' as any)
          .update({ read: true })
          .eq('recipient_id', currentUserId)
          .eq('sender_id', userId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const conversationId = `${currentUserId}_${selectedConversation}`;
      
      const { error } = await supabase
        .from('messages' as any)
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          recipient_id: selectedConversation,
          message: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(selectedConversation);
      fetchConversations();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to Send",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
        </CardTitle>
        <CardDescription>
          Connect with students, employers, and mentors
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex gap-4 min-h-0">
        {/* Conversations List */}
        <div className="w-1/3 border-r pr-4 flex flex-col">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {conversations
                .filter(conv => 
                  conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => {
                      setSelectedConversation(conv.userId);
                      fetchMessages(conv.userId);
                    }}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedConversation === conv.userId
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{conv.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">{conv.userName}</span>
                          {conv.unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm opacity-70 truncate">{conv.lastMessage}</p>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversation ? (
            <>
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4 p-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.sender_id === currentUserId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}