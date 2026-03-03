# Admin Panel Module

A comprehensive administrative interface for the Diagramers Framework that provides complete identity and system management capabilities.

## 🚀 Features

### **Core Functionality**
- **Complete Admin Interface**: Full-featured React-based admin panel
- **Identity Management**: Users, roles, permissions, and access control
- **System Overview**: Real-time statistics, health monitoring, and performance metrics
- **Module Discovery**: Auto-discovery of framework modules and endpoints
- **Audit & Logging**: Comprehensive system audit trails and log management
- **Settings Management**: System configuration and customization

### **User Management**
- Create, edit, and delete users
- Assign roles and permissions
- User activity monitoring
- Account status management
- Bulk user operations

### **Role Management**
- Role creation and configuration
- Permission assignment
- Role inheritance
- System vs. custom roles
- Role usage analytics

### **Permission Management**
- Dynamic permission system
- Module-based permissions
- Action-level control
- User and role assignments
- Permission generation

### **System Monitoring**
- Real-time health checks
- Performance metrics
- Resource utilization
- Database status
- API endpoint monitoring

## 🏗️ Architecture

### **Module Structure**
```
admin-panel/
├── controllers/          # HTTP request handlers
├── services/            # Business logic layer
├── routes/              # API endpoint definitions
└── views/               # Frontend interface files
```

### **Key Components**

#### **AdminPanelController**
- Serves the React interface
- Handles admin panel requests
- Manages asset serving
- Provides configuration endpoints

#### **AdminPanelService**
- Business logic for admin operations
- System statistics calculation
- Health monitoring
- Activity tracking

#### **Routes**
- `/admin` - Main admin panel interface
- `/admin/config` - Configuration data
- `/admin/navigation` - Navigation structure
- `/admin/stats` - System statistics
- `/admin/overview` - Comprehensive overview
- `/admin/health` - System health status
- `/admin/actions` - Execute admin actions

## 🔐 Access Control

### **Required Permissions**
- `ADMIN_PANEL_ACCESS` - Basic access to admin panel
- `ADMIN_PANEL_FULL_ACCESS` - Full administrative capabilities

### **User Roles**
- **Super Admin**: Full access to all features
- **Identity Manager**: User, role, and permission management
- **Admin**: Module and system management
- **User**: Basic access (read-only)

## 🎯 Usage

### **Accessing the Admin Panel**

1. **Start the API server**:
   ```bash
   npm start
   ```

2. **Navigate to the admin panel**:
   ```
   http://localhost:3000/admin
   ```

3. **Login with admin credentials**:
   - Email: `admin@sendifier.com`
   - Password: `Sendifier#2025`

### **API Endpoints**

#### **Get Admin Configuration**
```bash
GET /admin/config
Authorization: Bearer <token>
```

#### **Get Navigation Structure**
```bash
GET /admin/navigation
Authorization: Bearer <token>
```

#### **Get System Statistics**
```bash
GET /admin/stats
Authorization: Bearer <token>
```

#### **Get System Overview**
```bash
GET /admin/overview
Authorization: Bearer <token>
```

#### **Get System Health**
```bash
GET /admin/health
Authorization: Bearer <token>
```

#### **Execute Admin Action**
```bash
POST /admin/actions
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "addUser",
  "data": {
    "email": "user@example.com",
    "username": "newuser",
    "firstName": "New",
    "lastName": "User"
  }
}
```

## 🎨 Frontend Interface

### **React Components**
- **Dashboard**: Overview and quick actions
- **User Management**: User CRUD operations
- **Role Management**: Role configuration
- **Permission Management**: Permission assignment
- **Module Discovery**: Framework exploration
- **System Health**: Monitoring and alerts

### **Material-UI Integration**
- Modern, responsive design
- Consistent component library
- Professional appearance
- Mobile-friendly interface

### **Features**
- Real-time data updates
- Interactive charts and graphs
- Search and filtering
- Bulk operations
- Export functionality

## 🔧 Configuration

### **Environment Variables**
```bash
# Admin Panel Configuration
ADMIN_PANEL_ENABLED=true
ADMIN_PANEL_THEME=default
ADMIN_PANEL_LANGUAGE=en
ADMIN_PANEL_TIMEZONE=UTC
```

### **Customization Options**
- Theme selection
- Language preferences
- Timezone settings
- Date/time formats
- Feature toggles

## 📊 Monitoring & Analytics

### **System Metrics**
- User activity tracking
- API usage statistics
- Performance monitoring
- Error rate tracking
- Resource utilization

### **Health Checks**
- Database connectivity
- Memory usage
- CPU utilization
- Disk space
- Network status

## 🚨 Security Features

### **Authentication**
- JWT token validation
- Session management
- Multi-factor authentication support

### **Authorization**
- Role-based access control
- Permission-based restrictions
- API endpoint protection

### **Audit Trail**
- User action logging
- System event tracking
- Security incident monitoring
- Compliance reporting

## 🔄 Integration

### **With Other Modules**
- **Permissions Manager**: Role and permission management
- **User Module**: User data and operations
- **Logging Module**: Audit trails and monitoring
- **Discovery Service**: Module and endpoint discovery

### **External Systems**
- LDAP/Active Directory integration
- SSO providers
- Monitoring tools
- Log aggregation services

## 🚀 Development

### **Adding New Features**
1. Extend the `AdminPanelService` with new methods
2. Add corresponding controller methods
3. Define new routes
4. Update the React frontend
5. Add necessary permissions

### **Customizing the Interface**
1. Modify the React components
2. Update the Material-UI theme
3. Add new navigation items
4. Customize the dashboard layout

### **Testing**
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific tests
npm test -- --grep "AdminPanel"
```

## 📝 API Documentation

### **Swagger Integration**
The admin panel endpoints are automatically documented in Swagger:
- Access: `/api/docs`
- Authentication: Bearer token required
- Admin panel endpoints: `/admin/*`

### **Response Format**
All endpoints return standardized responses:
```json
{
  "data": {},
  "statusCode": 1000,
  "errors": [],
  "requestIdentifier": "ADMIN_PANEL_ACCESS_UUID",
  "messages": [],
  "additionalInfo": {}
}
```

## 🐛 Troubleshooting

### **Common Issues**

#### **Admin Panel Not Loading**
- Check if the server is running
- Verify authentication token
- Check browser console for errors
- Ensure proper permissions

#### **Permission Denied**
- Verify user has required permissions
- Check role assignments
- Review permission configuration
- Ensure proper authentication

#### **Data Not Loading**
- Check database connectivity
- Verify service dependencies
- Review error logs
- Check API endpoint responses

### **Debug Mode**
Enable debug logging:
```bash
LOG_LEVEL=debug npm start
```

## 🔮 Future Enhancements

### **Planned Features**
- Advanced analytics dashboard
- Custom report generation
- Workflow automation
- Integration with external tools
- Mobile app support

### **Scalability Improvements**
- Caching layer
- Database optimization
- Load balancing support
- Microservice architecture

## 📚 Additional Resources

- [Developer Guide](../../../DEVELOPER_GUIDE.md)
- [API Documentation](../../../public/swagger.json)
- [Permissions Manager](../permissions-manager/README.md)
- [User Module](../user/README.md)

## 🤝 Contributing

1. Follow the project coding standards
2. Add comprehensive tests
3. Update documentation
4. Ensure proper error handling
5. Follow security best practices

---

**Note**: This admin panel is designed for system administrators and requires appropriate permissions to access. Always ensure proper security measures are in place when deploying to production environments.
