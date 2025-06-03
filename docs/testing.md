# Testing Documentation

## Testing Strategy

### 1. Unit Tests

#### Frontend Unit Tests
```javascript
// Example test for AuthPage component
describe('AuthPage', () => {
  it('handles login redirect correctly', () => {
    const params = new URLSearchParams('?redirect=/admin/dashboard?application=123&view=details');
    const redirect = params.get('redirect');
    expect(redirect).toBe('/admin/dashboard?application=123&view=details');
  });
});

// Example test for AdminDashboard
describe('AdminDashboard', () => {
  it('loads application details from URL params', () => {
    const params = new URLSearchParams('?application=123&view=details');
    const applicationId = params.get('application');
    const view = params.get('view');
    expect(applicationId).toBe('123');
    expect(view).toBe('details');
  });
});
```

#### Backend Unit Tests
```python
# Example test for authentication
def test_logout_redirect():
    admin_path = f"{FRONTEND_URL}/admin/dashboard?application=123&view=details"
    login_path = f"{FRONTEND_URL}/auth?redirect={quote(admin_path)}"
    redirect_url = f"{BACKEND_URL}/api/logout?redirect={quote(login_path)}"
    assert "redirect" in redirect_url
    assert "application=123" in unquote(redirect_url)

# Example test for application loading
def test_load_application_details():
    response = client.get("/api/applications/123")
    assert response.status_code == 200
    assert "id" in response.json()
```

### 2. Integration Tests

#### Authentication Flow
```python
def test_auth_flow():
    # 1. Logout and redirect
    response = client.get("/api/logout?redirect=/auth")
    assert response.status_code == 302
    
    # 2. Login
    response = client.post("/api/login", json={
        "email": "admin@test.com",
        "password": "password"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    
    # 3. Access protected route
    response = client.get("/api/applications", 
                         headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
```

#### Application Management Flow
```python
def test_application_workflow():
    # 1. Create application
    response = client.post("/api/applications", json={...})
    assert response.status_code == 201
    app_id = response.json()["id"]
    
    # 2. Upload documents
    response = client.post(f"/api/applications/{app_id}/documents", files={...})
    assert response.status_code == 200
    
    # 3. Get application details
    response = client.get(f"/api/applications/{app_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "pending"
```

### 3. E2E Tests

```javascript
describe('Admin Workflow', () => {
  it('should handle complete admin workflow', async () => {
    // 1. Click email link
    await page.goto('/auth?redirect=/admin/dashboard?application=123&view=details');
    
    // 2. Login
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // 3. Check redirect
    await page.waitForURL('**/admin/dashboard?application=123&view=details');
    
    // 4. Check dialog
    const dialog = await page.locator('[role="dialog"]');
    expect(await dialog.isVisible()).toBe(true);
    
    // 5. Check application details
    const appId = await page.locator('[data-testid="application-id"]');
    expect(await appId.textContent()).toBe('123');
  });
});
```

## Test Coverage Requirements

1. **Frontend Coverage**
   - Components: 90%
   - Utils: 95%
   - Store: 95%

2. **Backend Coverage**
   - Routes: 95%
   - Services: 95%
   - Utils: 90%

## Testing Tools

1. **Frontend**
   - Jest for unit tests
   - React Testing Library for component tests
   - Playwright for E2E tests

2. **Backend**
   - Pytest for unit and integration tests
   - Coverage.py for coverage reporting

## CI/CD Integration

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Frontend Tests
        run: |
          cd frontend
          npm install
          npm test
          
      - name: Backend Tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest
          
      - name: E2E Tests
        run: |
          npm run test:e2e
```

## Test Data Management

1. **Test Database**
   - Separate test database
   - Fixtures for common scenarios
   - Cleanup after each test

2. **Mock Data**
   - Mock API responses
   - Mock file uploads
   - Mock authentication

## Regression Testing Checklist

1. Authentication
   - [ ] Email link redirect
   - [ ] Login with redirect
   - [ ] Token handling
   - [ ] Role-based access

2. Admin Dashboard
   - [ ] URL parameter handling
   - [ ] Application loading
   - [ ] Dialog opening
   - [ ] Data display

3. Application Management
   - [ ] Form submission
   - [ ] File uploads
   - [ ] Status updates
   - [ ] Email notifications
