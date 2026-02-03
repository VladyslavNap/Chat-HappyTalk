import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
}

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  messages: Message[] = [
    {
      text: 'Hello! Welcome to HappyTalk! 😊',
      sender: 'other',
      timestamp: new Date()
    }
  ];
  
  newMessage = '';

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.messages.push({
        text: this.newMessage,
        sender: 'user',
        timestamp: new Date()
      });
      
      this.newMessage = '';
      
      // Simulate a response after a short delay
      setTimeout(() => {
        this.messages.push({
          text: 'Thanks for your message! This is a demo chat. 🎉',
          sender: 'other',
          timestamp: new Date()
        });
      }, 1000);
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
