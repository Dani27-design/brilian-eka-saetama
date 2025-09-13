# Error Page Testing Guide

## Quick Start

The error handling system has been designed with comprehensive testing capabilities. Here are the fastest ways to test error pages:

### 1. Instant Testing - Natural 404 Errors
- **Public 404**: Visit [/non-existent-page](./non-existent-page) 
- **Admin 404**: Visit [/admin/non-existent-page](./admin/non-existent-page)

### 2. Comprehensive Testing Interface
- **Full Testing Suite**: Visit [/admin/error-test](./admin/error-test)
- **Enhanced Debug Console**: Visit [/admin/debug](./admin/debug)

## Testing Methods

### Method 1: Direct Navigation (Easiest)
Simply type any non-existent URL in your browser:

| URL Pattern | Error Type | Features Tested |
|------------|------------|-----------------|
| `/any-fake-page` | Public 404 | Site layout, animated SVG, contextual suggestions |
| `/admin/any-fake-page` | Admin 404 | Admin layout, admin-specific suggestions |
| `/products/fake-id` | Public 404 | Dynamic route handling |
| `/admin/customers/fake-id` | Admin 404 | Protected route handling |

### Method 2: Error Testing Interface (/admin/error-test)

#### Client-Side Error Testing
- **Throw Client Error** - Triggers React Error Boundary
- **Console Error** - Tests error logging system
- **Unhandled Promise** - Tests promise rejection handling

#### API Error Testing
- **API 500 Error** - Internal server error responses
- **API 404 Error** - Not found API responses  
- **API 503 Error** - Service unavailable responses
- **Network Timeout** - Simulates request timeouts
- **Invalid JSON** - Tests malformed response handling

#### Navigation Testing
- **Admin 404 Page** - Opens admin 404 in new tab
- **Public 404 Page** - Opens public 404 in new tab

### Method 3: Enhanced Debug Console (/admin/debug)

#### Error Logs Tab
- View all captured errors in real-time
- Auto-refreshes every 5 seconds
- Enhanced visualization with:
  - Color-coded error types
  - Error statistics
  - Severity indicators
  - Safe error IDs
  - Stack traces (development mode)

#### Error Testing Tab
- **Quick Error Components** - Instant error testing
- **Network Error Simulator** - Test various network failures
- **Authentication Error Simulator** - Test auth-related errors

## Error Types and Testing

### 1. 404 Not Found Errors

#### Public 404 Features:
- Animated magnifying glass with searching eye
- Contextual navigation suggestions
- "Go Home" and "Contact Support" buttons
- Responsive design for all screen sizes
- Search functionality integration

#### Admin 404 Features:
- Admin-specific navigation suggestions
- Quick access to dashboard and management tools
- Different styling matching admin theme

**Test URLs:**
```
/non-existent-page
/products/invalid-id
/services/fake-service
/blog/missing-post
```

### 2. 500 Server Errors

#### Features:
- Animated server rack with smoke effects
- LED status indicators showing "investigation in progress"
- Error ID for safe tracking (no sensitive data)
- Contact support integration
- Auto-refresh option for temporary issues

**Testing Methods:**
- Use `/admin/error-test` → API 500 Error
- Visit `/api/test-error/500` directly
- Trigger component errors that cause server boundaries to catch

### 3. Network and API Errors

#### Network Error Types:
- **Connection Timeout** - Request exceeds time limit
- **CORS Errors** - Cross-origin request failures
- **JSON Parse Errors** - Invalid response format
- **Offline Network** - No internet connection
- **Service Unavailable** - 503 server responses

**Testing:**
1. Go to `/admin/debug` → Error Testing tab
2. Use Network Error Simulator
3. Test different network conditions

### 4. Authentication Errors

#### Auth Error Types:
- **Expired Token** - Session timeout
- **Invalid Session** - Corrupted session data  
- **Permission Denied** - Insufficient permissions
- **Unauthorized Access** - 401 responses

**Testing:**
1. Go to `/admin/debug` → Error Testing tab
2. Use Authentication Error Simulator
3. ⚠️ **Warning**: Some tests will log you out

## Mobile Testing

### Testing on Mobile Devices

1. **Error Logger Access**: All errors are logged to localStorage and viewable at `/admin/debug`

2. **Mobile-Specific Features**:
   - Touch-friendly error page interactions
   - Optimized animations for mobile performance
   - Responsive typography and layouts
   - Error logging for mobile debugging

3. **Mobile Testing Steps**:
   ```
   1. Open mobile browser
   2. Navigate to any test URL
   3. Observe error page behavior
   4. Go to /admin/debug to check logged errors
   5. Test touch interactions and navigation
   ```

### Cross-Device Verification

| Device Type | Test Focus | Key Areas |
|-------------|-----------|-----------|
| **Mobile Phone** | Touch interactions, viewport sizing | Error buttons, navigation, animations |
| **Tablet** | Medium screen layouts | Component scaling, text readability |
| **Desktop** | Full feature set | Complete animations, hover effects |

## Security Testing

### What Gets Sanitized
The error sanitization system removes:
- File paths (Windows/macOS/Linux)
- API keys and tokens
- Database connection strings
- Internal IP addresses
- Email addresses in error context
- Firebase credentials
- Stack trace file paths

### Testing Security
1. Trigger errors with sensitive data
2. Check `/admin/debug` logs
3. Verify sensitive information is removed
4. Confirm safe error IDs are generated

## Performance Testing

### Animation Performance
Test on different devices:
- **Desktop**: Full animations enabled
- **Mobile**: Optimized animations for performance
- **Low-end devices**: Graceful degradation

### Error Logging Performance
- Test with many errors (50+ logs)
- Verify localStorage limits work correctly
- Check auto-cleanup functionality

## Advanced Testing Scenarios

### 1. Error Boundary Testing
Create components that throw errors at different lifecycle stages:
```javascript
// Available in /admin/debug → Error Testing tab
- Render Error (throws during render)
- useEffect Error (throws in effect hook)  
- Event Handler Error (throws in click handler)
- Async Error (unhandled promise rejection)
```

### 2. Network Condition Testing
- **Offline mode**: Turn off internet, trigger network calls
- **Slow network**: Use browser dev tools to throttle
- **Failed requests**: Test various HTTP status codes

### 3. Authentication Flow Testing
- **Session expiry**: Clear localStorage, access protected routes
- **Invalid tokens**: Corrupt auth data, test recovery
- **Permission changes**: Test different user permission levels

## Debugging Tools

### Browser Developer Tools
1. **Console**: View real-time errors
2. **Network**: Monitor API responses
3. **Application**: Check localStorage error logs
4. **Performance**: Monitor error page rendering

### Error Logger Debug
Access via `window.errorLogger` in browser console:
```javascript
// View all logs
window.errorLogger.getLogs()

// Clear logs  
window.errorLogger.clearLogs()

// Get device info
window.errorLogger.getDeviceInfo()

// Export logs
window.errorLogger.exportLogs()
```

## Automated Testing

### Test Checklist
- [ ] Public 404 page loads and displays correctly
- [ ] Admin 404 page loads with admin styling
- [ ] 500 error page shows proper error handling
- [ ] Error logging captures and sanitizes data
- [ ] Mobile responsive design works on all screen sizes
- [ ] Animations perform well across devices
- [ ] Security sanitization removes sensitive data
- [ ] Error recovery and navigation functions work
- [ ] All error testing tools function properly

### Browser Testing Matrix
| Browser | Desktop | Mobile | Tablet |
|---------|---------|--------|--------|
| Chrome | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |

## Troubleshooting

### Common Issues and Solutions

**Problem**: Error pages not showing custom design
- **Solution**: Check if error.tsx files are in correct locations
- **Check**: Verify ErrorBoundary components are properly imported

**Problem**: Errors not being logged
- **Solution**: Check if errorLogger is initialized in browser
- **Check**: Verify localStorage has space and permissions

**Problem**: Animations not working on mobile
- **Solution**: Check mobile performance settings
- **Check**: Test on actual device vs. browser dev tools

**Problem**: Error pages showing default Next.js errors
- **Solution**: Ensure error files are in correct directory structure
- **Check**: Verify error.tsx and not-found.tsx files exist

### Getting Help

1. **Check Error Logs**: `/admin/debug` for detailed error information
2. **Export Logs**: Use export function to save error data
3. **Test Environment**: Use `/admin/error-test` to reproduce issues
4. **Device Information**: Check device info in debug console

## Quick Reference

### Essential URLs
- **Public 404**: `/any-fake-url` 
- **Admin 404**: `/admin/any-fake-url`
- **Full Testing**: `/admin/error-test`
- **Debug Console**: `/admin/debug`
- **API Errors**: `/api/test-error/[type]`

### Key Features to Test
✅ Responsive design across all devices  
✅ Interactive animations and transitions  
✅ Error logging and sanitization  
✅ Navigation and recovery options  
✅ Security measures and data protection  
✅ Cross-browser compatibility  
✅ Mobile-specific error handling  

---

**Note**: This testing system is designed for development and staging environments. Some test routes should be removed or restricted in production.