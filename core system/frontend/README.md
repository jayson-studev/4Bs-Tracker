# Barangay Financial System - Frontend

A modern React-based frontend application for the Barangay Financial Management System with blockchain integration.

## Features

- **Authentication System**
  - Login and Registration with JWT tokens
  - Invitation token-based registration
  - Initial system setup for first-time users
  - Role-based access control (Chairman and Treasurer)

- **Dashboard**
  - Overview of user information
  - Term tracking with warnings for expiring terms
  - Quick action cards for all modules
  - Account information display

- **Financial Management Modules**
  - **Allocations**: Submit and approve budget allocations across 8 fund types
  - **Proposals**: Create and review financial proposals with detailed information
  - **Expenditures**: Record and approve expenditure requests with optional proposal linking
  - **Income**: Record barangay revenue with immediate blockchain recording

- **Officials Management** (Chairman Only)
  - Generate succession tokens for next term officials
  - Deactivate officials
  - Email pre-assignment for tokens

- **Blockchain Integration**
  - Real-time blockchain transaction recording
  - Transaction hash display
  - Document integrity with SHA-256 hashing

## Technology Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router v7** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Icon library
- **CSS Variables** - Theming and styling

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Layout.jsx           # Main layout with navigation
│   ├── context/
│   │   └── AuthContext.jsx      # Authentication context provider
│   ├── pages/
│   │   ├── Login.jsx            # Login page
│   │   ├── Register.jsx         # Registration page
│   │   ├── InitialSetup.jsx     # Initial token generation
│   │   ├── Dashboard.jsx        # Main dashboard
│   │   ├── Allocations.jsx      # Allocations module
│   │   ├── Proposals.jsx        # Proposals module
│   │   ├── Expenditures.jsx     # Expenditures module
│   │   ├── Income.jsx           # Income recording module
│   │   └── Officials.jsx        # Officials management
│   ├── services/
│   │   └── api.js               # API service layer with axios
│   ├── App.jsx                  # Main app component with routing
│   ├── main.jsx                 # Application entry point
│   └── index.css                # Global styles
├── index.html                   # HTML template
├── vite.config.js               # Vite configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on `http://localhost:5000`

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd "core system/frontend"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Getting Started

### First-Time Setup

1. **Generate Initial Tokens**
   - Visit `/setup` or click "Initial Setup" on the login page
   - Click "Generate Tokens" to create Chairman and Treasurer invitation tokens
   - Save these tokens securely

2. **Register Officials**
   - Visit `/register` or click "Register here" on the login page
   - Enter your invitation token
   - Fill in your details (the form validates Philippine phone format: +639XXXXXXXXX)
   - Submit to create your account

3. **Login**
   - Use your registered email and password
   - You'll be redirected to the dashboard

### User Workflows

#### As Treasurer:
1. **Submit Allocations**
   - Navigate to Allocations → Click "New Allocation"
   - Select allocation type, enter amount, upload supporting document
   - Submit for Chairman approval

2. **Submit Proposals**
   - Navigate to Proposals → Click "New Proposal"
   - Fill in purpose, amount, fund source, expense type, and proposer
   - Upload supporting document → Submit

3. **Submit Expenditures**
   - Navigate to Expenditures → Click "New Expenditure"
   - Enter amount, select fund source
   - Optionally link to a proposal ID
   - Upload document → Submit

4. **Record Income**
   - Navigate to Income → Click "Record Income"
   - Select revenue source, enter amount
   - Upload document → Record (immediate blockchain recording)

#### As Chairman:
1. **Review and Approve/Reject**
   - Navigate to any module (Allocations, Proposals, Expenditures)
   - Review pending items
   - Click Approve (records on blockchain) or Reject (with reason)

2. **Manage Officials**
   - Navigate to Officials
   - Generate succession tokens for next term
   - Optionally pre-assign email addresses
   - Deactivate officials as needed

## API Configuration

The frontend connects to the backend API at `http://localhost:5000/api` by default.

To change the API URL, edit `src/services/api.js`:

```javascript
const API_BASE_URL = 'http://your-backend-url/api';
```

Alternatively, the Vite proxy is configured in `vite.config.js` to forward `/api` requests to the backend.

## Authentication

The application uses JWT (JSON Web Tokens) for authentication:

- Tokens are stored in `localStorage` with key `token`
- User information is stored with key `user`
- Tokens are automatically included in API requests via Axios interceptors
- Expired/invalid tokens trigger automatic redirect to login

Token expiration: **12 hours** (configured on backend)

## Role-Based Access

- **Chairman**:
  - Full access to all modules
  - Can approve/reject financial documents
  - Can manage officials
  - Can generate succession tokens

- **Treasurer**:
  - Can submit allocations, proposals, and expenditures
  - Can record income
  - Cannot approve/reject (view only)
  - Cannot access Officials page

## Styling and Theming

The application uses CSS variables for theming, defined in `src/index.css`:

```css
:root {
  --primary: #2563eb;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  /* ... more variables */
}
```

Modify these variables to customize the color scheme.

### Responsive Design

- Mobile-first approach
- Sidebar collapses on mobile devices
- Tables and cards adapt to smaller screens
- Breakpoint: 768px

## File Upload

Supporting documents are converted to **base64** strings before sending to the backend:

```javascript
const reader = new FileReader();
reader.onloadend = () => {
  // result contains base64 string
  setFormData({ ...formData, supportingDocument: reader.result });
};
reader.readAsDataURL(file);
```

Accepted formats: `.pdf`, `.jpg`, `.jpeg`, `.png`

## Important Notes

### Phone Number Format
Must follow Philippine format: `+639XXXXXXXXX`
- Starts with +639
- Followed by 9 digits
- Example: +639123456789

### Password Requirements
- Minimum 6 characters
- No special character requirements (can be enhanced)

### Invitation Tokens
- Valid for 30 days
- One-time use only
- Can be pre-assigned to specific emails

### Blockchain Recording
- Allocations, Proposals, Expenditures: Recorded on approval
- Income: Recorded immediately upon submission
- Transaction hash displayed after recording
- `onChain` flag indicates blockchain success/failure

## Future Enhancements

The current implementation provides the foundation. Consider adding:

1. **Data Fetching**
   - Implement GET endpoints for listing documents
   - Add pagination and filtering
   - Real-time updates with polling or WebSockets

2. **Advanced Features**
   - Search and filter functionality
   - Export to PDF/Excel
   - Charts and analytics
   - Audit trail visualization
   - Document preview

3. **UI Improvements**
   - Loading skeletons
   - Better error handling
   - Toast notifications
   - Confirmation dialogs (using a library)
   - Form validation feedback

4. **Security**
   - HTTPS enforcement
   - CSRF protection
   - Rate limiting display
   - Session timeout warnings

5. **Testing**
   - Unit tests with Vitest
   - Integration tests
   - E2E tests with Playwright

## Troubleshooting

### "Cannot connect to backend"
- Ensure backend is running on `http://localhost:5000`
- Check if Vite proxy is working correctly
- Verify CORS settings on backend

### "Token expired" errors
- Login again to get a fresh token
- Check system clock is correct

### File upload fails
- Check file size (backend may have limits)
- Ensure file format is accepted (.pdf, .jpg, .jpeg, .png)
- Verify base64 encoding is working

### Layout issues on mobile
- Clear browser cache
- Check responsive breakpoints in CSS
- Test on actual devices, not just browser dev tools

## Development Tips

1. **Use React DevTools** for debugging component state
2. **Check Network tab** to inspect API calls
3. **Console logs** are your friend for debugging
4. **Hot reload** is enabled - save to see changes immediately

## Contributing

When adding new features:

1. Follow the existing folder structure
2. Use the established API service pattern
3. Maintain consistent styling with existing components
4. Add appropriate error handling
5. Update this README with new features

## License

This project is part of the Barangay Financial System. All rights reserved.

## Support

For issues or questions, please contact the development team or refer to the main project documentation.
