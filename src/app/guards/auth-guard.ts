import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Simple demo guard - in production, this would check actual authentication
  // For now, we'll always allow access but log the attempt
  const isAuthenticated = true; // In a real app, check auth service
  
  if (!isAuthenticated) {
    // Redirect to home if not authenticated
    router.navigate(['/']);
    return false;
  }
  
  return true;
};
