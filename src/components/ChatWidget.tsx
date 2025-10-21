import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatDialog from './ChatDialog';

interface ChatWidgetProps {
  contextType: 'student' | 'employer' | 'general';
}

const ChatWidget = ({ contextType }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Chat Dialog */}
      <ChatDialog 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        contextType={contextType}
      />
    </>
  );
};

export default ChatWidget;
