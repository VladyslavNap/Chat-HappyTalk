
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

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
    connect: jasmine.createSpy('connect').and.returnValue(Promise.resolve()),
    disconnect: jasmine.createSpy('disconnect').and.returnValue(Promise.resolve()),
    sendMessage: jasmine.createSpy('sendMessage'),
    joinRoom: jasmine.createSpy('joinRoom'),
    leaveRoom: jasmine.createSpy('leaveRoom')
  };

  const mockAuthService = {
    currentUser: signal(null),
    isAuthenticated: signal(false),
    login: jasmine.createSpy('login'),
    logout: jasmine.createSpy('logout')
  };

  const mockNotificationService = {
    showSuccess: jasmine.createSpy('showSuccess'),
    showError: jasmine.createSpy('showError'),
    showInfo: jasmine.createSpy('showInfo')
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
