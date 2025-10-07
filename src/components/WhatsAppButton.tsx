import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/351929070650"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-50 bg-[#25D366] text-white p-3 sm:p-4 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 flex items-center justify-center"
      aria-label="Contato WhatsApp"
    >
      <MessageCircle size={24} className="sm:w-8 sm:h-8" />
    </a>
  );
};

export default WhatsAppButton;