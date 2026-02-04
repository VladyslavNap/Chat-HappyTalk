
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { Chat } from './chat';
import { SignalRService } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

describe('Chat', () => {
  let component: Chat;
  let fixture: ComponentFixture<Chat>;

  // Mock services
  const mockSignalRService = {
    messages: signal([]),
    connected: signal(false),
    connectionError: signal<string | null>(null),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    loadHistory: vi.fn().mockResolvedValue([])
  };

  const mockAuthService = {
    currentUser: signal(null),
    isAuthenticated: signal(false),
    login: vi.fn(),
    logout: vi.fn()
  };

  const mockNotificationService = {
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn()
  };


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chat],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: SignalRService, useValue: mockSignalRService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Chat);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
